
import {Cap} from "./Cap";
import {WarpDisplay} from "./WarpDisplay";
import {Store} from "./Store";
import {User} from "./User";
import {Editor} from "./Editor";
import {Draft, DraftEvent} from "./Draft";
import {Ui} from "./Ui";
import {Controler} from "./Controler";

import {EventType, AppState, AppStruct, StartState, EditorMode, EndInfo, StateType, AppControler} from "./AppState";

export module App  {


    export interface App {
        update( state: StateType, struct: AppStruct ): void ;
    }


    function startApp ( controler: AppControler, store: Store.Store, userCap: Cap.Cap, capString: string ): Draft.DraftControler {

        let eventMap: { [key:number]:DraftEvent; } = { };

        eventMap[ EventType.UpdateDraft ] = DraftEvent.Update;
        eventMap[ EventType.SetTitle    ] = DraftEvent.SetTitle;
        eventMap[ EventType.NewDraft    ] = DraftEvent.NewDocument;
        eventMap[ EventType.CopyDraft   ] = DraftEvent.CopyDocument;
        eventMap[ EventType.ReceivedCap ] = DraftEvent.LoadCap;


        let draftControler = <Draft.DraftControler>controler
            .delegate( EventType.DraftChanged, Draft.StartState( ), eventMap );

        Draft.DraftActor( draftControler, store )

        if ( capString === '' )
            Cap.newCap( )
            .then( 
                ( cap ) => {
                    draftControler.accept( DraftEvent.NewDocument, cap );
                });

        else 
            Cap.capFromString( capString )
            .then(
                ( cap ) => {
                    draftControler.accept( DraftEvent.LoadCap, cap );
                } )
            .catch(
                ( error ) => {
                    controler.accept( EventType.InvalidCap, error ) 
                } );
        

        // BUG: this should not be async and should match draft API
        User.factory( userCap, store )
            .then( updateUser )
            .catch( ( err ) => console.log( "load user error:", err, userCap ) )
        ;

        return draftControler;


        function updateUser ( data ) {
            controler.accept( EventType.ReceivedUser, data );
        }


    }



    function getUserCap ( ): Promise<Cap.Cap> {

        let capString = localStorage.getItem( 'UserCap' );
        
        if ( capString !== null )
            return Cap.capFromString( capString ).then( ( cap ) => {
                if ( cap === undefined )
                    return Promise.reject( capString );

                return cap;
            });

        else
            return Cap.newCap( ).then( ( cap ) => {
                localStorage.setItem( 'UserCap', cap.toString() );
                return cap;
            });
    }

    export function factory ( root : HTMLElement ) : App {

        var self = {
            update : update,
        };


        let state = StartState.make( );

        // BUG: we should not be hardcoding the empty struct hear.
        let fStruct: AppStruct = { 
	        user       : undefined,
	        draft      : undefined,
	        log        : undefined,
	        editorMode : EditorMode.Default,
	        endInfo    : EndInfo.Indexes,
        } ;

        let fControler = <AppControler>Controler.factory( state );
        let capString  = location.hash.slice( 1 );

        let fStore   = Store.factory( )

        let fEditor  = Editor.factory( fControler, root, '' );
        let fDisplay = WarpDisplay.factory( fControler, root );
        let fUi      = Ui.factory( fControler, root, fEditor );

        let fCapString;



        fControler.subscribe( update );


        // BUG: We should make this not force reload, but we
        // will have to make sure we are reseting state properly.
        window.onhashchange = function () {
            capString  = location.hash.slice( 1 );
            
            if ( capString === fCapString )
                return;

            Cap.capFromString( capString ).then( ( cap ) => {
                if ( cap === undefined )
                    fControler.accept( EventType.InvalidCap, capString );

                else
                    fControler.accept( EventType.ReceivedCap, cap );

            });
        }


        let fDraftControler;

        getUserCap( ).then( ( userCap ) => {
            fDraftControler = startApp( fControler, fStore, userCap, capString );
        } );

        return self;


        function update ( state: StateType, struct: AppStruct ): void {
            

            if ( state === StateType.Error ) {
                fStruct = fControler.reset( ).struct;
                return;
            }
            
            fUi.update( state, struct );

            changed( fStruct.draft, struct.draft, 'cap', ( ) => {
                fCapString = struct.draft.cap.toString( );
                location.hash = fCapString;
            } );

            changed( fStruct, struct, 'user', ( ) => {
                fUi.update( state, struct );
                struct.user.save( fStore );
            } );


            changed( fStruct, struct, 'endInfo', ( ) => {
                fDisplay.setPaletMode( struct.endInfo );
            } );


            changed( fStruct, struct, 'draft', ( ) => {

                var draftData = struct.draft.doc;

                if ( draftData !== undefined ) {
                    fDisplay.draw( draftData );

                    // BUG: should we really be setting code every time hear?
                    // Answer: No it causes a scroll to top event in code mirror
                    fEditor.setContents( draftData.code );

                    fEditor.setCaptiansLog( draftData.log );
                }

                if ( struct.draft.cap !== undefined ) {
                    if ( struct.draft.cap.isRead( ) === true ) 
                        fDisplay.setPaletMode( EndInfo.Counts );

                    fEditor.setReadOnly( struct.draft.cap.isRead( ) );
                }

            } );

            fStruct = struct;
        }


        function changed ( oldStruct, struct, key, action ) {
            if ( struct === undefined || struct[key] === undefined )
                return;

            if ( oldStruct === undefined || struct[key] !== oldStruct[key] )
                action();
        }
        

        /* BOOG
        function handleSaveResult ( result ) {
            if ( result.ok === true ) {
                // BUG: Sent saved status
            }

            else if ( result.data.code === 'serial' ) {
                fUi.alert( "The draft appears to be open in another tab.\n"
                                      + "Try switching to other tab or reloading to "
                                      + "allow editing." );
            }
                
        } */

    } 


}

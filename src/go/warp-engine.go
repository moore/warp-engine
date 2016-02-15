// Copyright 2015 Google Inc. All rights reserved.
// Use of this source code is governed by the Apache 2.0
// license that can be found in the LICENSE file.

package main

import (
        "bytes"
        "fmt"
        "net/http"
        "encoding/json"
        "crypto/sha256"
        "encoding/base64"

        "appengine"
        "appengine/datastore"
)

func init() {
        http.HandleFunc("/", handler)
        http.HandleFunc("/get", handleGet)
        http.HandleFunc("/set", handleSet)
}

func handler(w http.ResponseWriter, r *http.Request) {
        w.Write([]byte("Hello, world II the return!"))
}



type SetWarp struct {
        Preimage string
        Serial   int32
        Key      string
        DataType string
        Data     string
}


type GetWarp struct {
        Key string
}

type Warp struct {
        Serial   int32
        Key      string
        DataType string
        Data     string `datastore:",noindex"`
}


func handleSet(writer http.ResponseWriter, req *http.Request) {
        ctx := appengine.NewContext(req)

        decoder := json.NewDecoder(req.Body)

        var setWarp SetWarp
        
        err := decoder.Decode(&setWarp)

        if err != nil {
                http.Error(writer, 
                        "{\"code\":\"bad-request\", \"reason\":\"bad json\"}", 
                        http.StatusBadRequest)
                return
        }

        preimageBytes, err := base64.StdEncoding.DecodeString( setWarp.Preimage );

        if err != nil {
                http.Error(writer, 
                        "{\"code\":\"bad-request\", \"reason\":\"bad cap\"}", 
                        http.StatusBadRequest)
                return
        }

        keyBytes, err := base64.StdEncoding.DecodeString( setWarp.Key );

        if err != nil {
                http.Error(writer, 
                        "{\"code\":\"bad-request\", \"reason\":\"bad key\"}", 
                        http.StatusBadRequest)
                return
        }

        computedKeyBytes := sha256.Sum256(preimageBytes)

        if bytes.Equal(keyBytes, computedKeyBytes[:15] ) != true {
                http.Error(writer, 
                        "{\"code\":\"auth\", \"reason\":\"worng cap\"}", 
                        http.StatusBadRequest)
                return
        }
        
        warp := Warp {
                Serial : setWarp.Serial,
                Key   : setWarp.Key,
                DataType : setWarp.DataType,
                Data : setWarp.Data,
        }
        

        key := datastore.NewKey(ctx, "Warp", warp.Key, 0, nil)


        err = datastore.RunInTransaction(ctx, func(context appengine.Context) error {

                var existing Warp

                err := datastore.Get(context, key, &existing )

                if err != nil && err != datastore.ErrNoSuchEntity {
                        return err
			
		} else if err == nil && existing.Serial >= warp.Serial {
                        errorString := fmt.Sprintf("{\"code\":\"serial\", \"reason\":\"serial mismatch %v >= %v\"}", 
                                existing.Serial, warp.Serial)
                        http.Error(writer, errorString, http.StatusBadRequest)
                        return nil
                }

                _, err = datastore.Put(context, key, &warp)


                if err != nil {
                        return err
                } else {
                        result := fmt.Sprintf("{\"code\":\"ok\", \"serial\": %v }",
				warp.Serial )

                        writer.Write([]byte(result))

                        return nil
                }
        }, nil)

        if err != nil {
                errorString := fmt.Sprintf(
                        "{\"code\":\"internal\", \"reason\":\"%v\"}",
                        err.Error() )

                http.Error(writer, errorString, http.StatusInternalServerError)
                return
        }
}

func handleGet(writer http.ResponseWriter, req *http.Request) {
        ctx := appengine.NewContext(req)

        decoder := json.NewDecoder(req.Body)

        var getWarp GetWarp
        
        err := decoder.Decode(&getWarp)

        if err != nil {
                http.Error(writer, 
                        "{\"code\":\"bad-request\", \"reason\":\"bad json\"}", 
                        http.StatusBadRequest)
                return
        }

        var warp Warp

        key := datastore.NewKey(ctx, "Warp", getWarp.Key, 0, nil)

        getErr := datastore.Get(ctx, key, &warp);

        if getErr == datastore.ErrNoSuchEntity {
                errorString := fmt.Sprintf(
                        "{\"code\":\"no-record\", \"reason\":\"%v\"}",
                        getWarp.Key )

                http.Error(writer, errorString, http.StatusNotFound )
                return

        } else if getErr != nil {
                errorString := fmt.Sprintf(
                        "{\"code\":\"internal\", \"reason\":\"%v\"}",
                        err.Error() )

                http.Error(writer, errorString, http.StatusInternalServerError)
                return
        }

        warpString, _ := json.Marshal(warp)
        
        resultString := fmt.Sprintf(
                "{\"code\":\"ok\", \"data\":%s}",
                warpString )


        writer.Write([]byte(resultString))

}

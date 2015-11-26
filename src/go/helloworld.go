// Copyright 2015 Google Inc. All rights reserved.
// Use of this source code is governed by the Apache 2.0
// license that can be found in the LICENSE file.

package main

import (
	"log"
	"net/http"
	"appengine"
	"appengine/datastore"
)

func main() {
	http.HandleFunc("/", handler)
	http.HandleFunc("/get", handleGet)
	http.HandleFunc("/set", handlerSet)
	log.Print("Listening on port 8080")
	log.Fatal(http.ListenAndServe(":8080", nil))
}

func handler(w http.ResponseWriter, r *http.Request) {
	w.Write([]byte("Hello, world II the return!"))
}



type SetWarp struct {
	Preimage string
	Key      string
	DataType string
	Data     string
}

type Warp struct {
	Key      string
	DataType string
	Data     string
}


func handleSet(writer http.ResponseWriter, req *http.Request) {
	context := appengine.NewContext(req)

	decoder := json.NewDecoder(req.Body)

	var setWarp SetWarp
	
	err := decoder.Decode(&setWarp)

	if err != nil {
		http.Error(writer, err.Error(), http.StatusInternalServerError)
	}

	var warp := Warp {
		Key        : setWarp.Key,
		JavaScript : setWarp.JavaScript,
	}
	

	key, err := datastore.Put(context,
		datastore.NewIncompleteKey(context, warp.key, nil), &warp)

	if err != nil {
		http.Error(writer, err.Error(), http.StatusInternalServerError)
		return
	}

}

func handleSet(writer http.ResponseWriter, req *http.Request) {
	context := appengine.NewContext(req)
	
	var warp Warp
	
	if err = datastore.Get(context, key, &warp); err != nil {
		http.Error(writer, err.Error(), http.StatusInternalServerError)
		return
	}

	warpString, _ := json.Marshal(warp)

	writer.Write([]byte(warpString))

}

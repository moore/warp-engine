// Copyright 2015 Google Inc. All rights reserved.
// Use of this source code is governed by the Apache 2.0
// license that can be found in the LICENSE file.

package main

import (
	"log"
	"net/http"
	"encoding/json"
	"appengine"
	"appengine/datastore"
)

func main() {
	http.HandleFunc("/", handler)
	http.HandleFunc("/get", handleGet)
	http.HandleFunc("/set", handleSet)
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

type GetWarp struct {
	Key string
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

	warp := Warp {
		Key   : setWarp.Key,
		DataType : "JavaScript",
		Data : setWarp.Data,
	}
	

	_, getErr := datastore.Put(context, datastore.NewIncompleteKey(context, warp.Key, nil), &warp)

	if err != nil {
		http.Error(writer, getErr.Error(), http.StatusInternalServerError)
		return
	}

}

func handleGet(writer http.ResponseWriter, req *http.Request) {
	context := appengine.NewContext(req)

	decoder := json.NewDecoder(req.Body)

	var getWarp GetWarp
	
	err := decoder.Decode(&getWarp)

	if err != nil {
		http.Error(writer, err.Error(), http.StatusInternalServerError)
	}

	var warp Warp
	
	getErr := datastore.Get(context, datastore.NewIncompleteKey(context, getWarp.Key, nil), &warp);

	if err != nil {
		http.Error(writer, getErr.Error(), http.StatusInternalServerError)
		return
	}

	warpString, _ := json.Marshal(warp)

	writer.Write([]byte(warpString))

}

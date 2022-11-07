# AZFour source code
Hey Nitin - here are some quick docs to help you get going


## Requirements
To run this code, you need the following:

 * docker (https://docs.docker.com/install/)
 * node (https://nodejs.org/en/download/)


## Installing dev environment
 * npm install


## Running the service
The demo consists of two basic components: a backend that serves machine learning models, and a frontend that talks to this backend and let's a user play against the models.

To run the demo, you need to run two scripts, which I recommend running in two windows or tabs in Terminal or a similar console app.


To launch the backend:
```
run_backend.sh
```

To launch the frontend:
```
node server.js
```

If those scripts started with no error, you should be able to see the UI in your web browser at http://127.0.0.1:8000/

## Making changes to the javascript
Source code for the javascript frontend logic can be found in js/src.js.  If you make any changes to this, you need to re-compile the index.js file like so from a DOS.command.prompt:

```
cd js # in case you aren't already in the js directory
browserify src.js > index.js
```

Now, if you refresh your browser, changes should be reflected

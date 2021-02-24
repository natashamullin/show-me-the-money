let db;

const request = indexedDB.open('budget_tracker', 1);
request.onupgradeneeded = function (event) {
    const db = event.target.result;
    db.createObjectStore('pending', { autoIncrement: true }); 0
};

request.onsuccess = function (event) {
    db = event.target.result;
    if (navigator.onLine) {
        uploadTransaction();
    }
};

request.onerror = function (event) {
    console.log(event.target.errorCode);
};

function saveRecord(record) {
    const transaction = db.transaction(['pending'], 'readwrite');
    const transactionObjectStore = transaction.objectStore('pending');
    transactionObjectStore.add(record);
}

function uploadTransaction() {
    //open a transaction on your db
    const transaction = db.transaction(['pending'], 'readwrite');

    //access you object store
    const transactionObjectStore = transaction.objectStore('pending');

    //get all records from store and set to a variable
    const getAll = transactionObjectStore.getAll();

    //upon a successful .getAll() execution, run this function
    getAll.onsuccess = function () {
        //if there was data in indexedDb's store, let's send it to the api server
        if (getAll.result.length > 0) {
            fetch('/api/transaction/bulk', {
                method: 'POST',
                body: JSON.stringify(getAll.result),
                headers: {
                    Accept: 'application/json, text/plain, */*',
                    'Content-Type': 'application/json'
                }
            })
                .then(response => response.json())
                .then(serverResponse => {
                    if (serverResponse.message) {
                        throw new Error(serverResponse);
                    }
                    // open one more transaction
                    const transaction = db.transaction(['pending'], 'readwrite');
                    //access the pending object store
                    const transactionObjectStore = transaction.objectStore('pending');
                    //clear all items in your store
                    transactionObjectStore.clear();

                    alert('All saved transactions have been submitted!')
                })
                .catch(err => {
                    console.log(err)
                });
        }
    };
}

// listen for app coming back online
window.addEventListener("online", uploadTransaction);

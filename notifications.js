var topics = {};
var database = firebase.database();
database.ref('blitzboard/test/topics').once('value').then(function (snap) {
    topics = snap.val();
});
for (var topic in topics) {
    database.ref('blitzboard/test/topics/' + topic).on('child_added', function (snap) {
        //notification
    });
}
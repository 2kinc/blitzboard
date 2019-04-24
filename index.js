function Site(ref) {
    var that = this;
    this.ref = ref;
    this.data = {};
    if (!this.ref) {
        return;
    }
    this.ref.once('value').then(function (snap) {
        that.data = snap.val();
    }).catch(function (err) {
        document.body.innerHTML = 'Sorry, a database error occured. (' + err + ').';
    });
};
var app = firebase;
var database = app.database();
var blitzboardRef = database.ref('blitzboard');
var ref = blitzboardRef.child('2kofficial');
var site = new Site();

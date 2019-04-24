function Site(ref) {
    var that = this;
    this.elements = {
        topics: $('#topics'),
        mainContent: $('#main-content'),
        posts: $('#posts'),
        chat: $('#chat'),
        nothingHere: $('#nothing-here')
    }
    this.ref = ref;
    this.data = {};
    if (!this.ref) {
        return;
    }
    this.ref.once('value').then(function (snap) {
        that.data = snap.val();
        that.data.render = function () {
            that.elements.topics.text('');
            for (var topic in that.data.topics) {
                var p = document.createElement('p');
                p.innerText = topic;
                that.elements.topics.append(p);
            }
            that.elements.nothingHere.hide();
        };
        that.data.render();
    }).catch(function (err) {
        document.body.innerHTML = 'Sorry, a database error occured. (' + err + ').';
    });
};

var app = firebase;
var database = app.database();
var auth = app.auth();
var blitzboardRef = database.ref('blitzboard');

function Blitzboard(id, structure) {
    var that = this;
    this.id = id;
    this.ref = database.ref('blitzboard/' + this.id);
    this.structure = structure;
    this.ref.once('value').then(function (snap) {
        if (snap.val())
            return;
        that.ref.set(structure);
    });
}

var site = new Site(new Blitzboard('test', {
    name: 'test.'
}).ref);
function Site(ref) {
    var that = this;
    this.elements = {
        topics: $('#more-topics'),
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
                var p = document.createElement('div');
                p.className = 'topic-item';
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

function Blitzboard(id, name) {
    var that = this;
    this.id = id;
    this.name = name;
    this.ref = database.ref('blitzboard/' + this.id);
    this.ref.once('value').then(function (snap) {
        if (snap.val())
            return;
        that.ref.child('name').set(that.name);
    });
}

var site = new Site(new Blitzboard('test', 'test.').ref);
function Site(ref) {
    var that = this;
    this.elements = {
        blitzboardTitle: $('#blitzboard-title'),
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
    this.currentTopic = 'Home';
    $('#home-topic').click(function () {
        that.currentTopic = 'Home';
        that.data.render();
        $('#home-topic').addClass('selected');
    });
    this.ref.once('value').then(function (snap) {
        that.data = snap.val();
        that.data.render = function () {
            that.elements.topics.text('');
            that.elements.blitzboardTitle.text(':: ' + that.currentTopic + ' - ' + that.data.name);
            $('.topic-item').each(function () {
                this.classList.remove('selected');
            });
            for (var topic in that.data.topics) {
                var p = document.createElement('div');
                p.className = 'topic-item';
                if (topic == that.currentTopic)
                    p.classList.add('selected');
                p.innerText = topic;
                p.addEventListener('click', function () {
                    that.currentTopic = topic;
                    that.data.render();
                });
                that.elements.topics.append(p);
            }
            that.elements.nothingHere.hide();
        };
        that.data.render();
        $('#home-topic').addClass('selected');
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
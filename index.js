function Site(ref) {
    var that = this;
    this.elements = {
        blitzboardTitle: $('#blitzboard-title'),
        topics: $('#more-topics'),
        mainContent: $('#main-content'),
        posts: $('#posts'),
        chat: $('#chat'),
        chatInput: $('#chat-input'),
        chatBody: $('#chat-body'),
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
    this.getMessageElement = function (m) {
        var p = document.createElement('p');
        p.innerText = m.message;
        p.className = 'message-body enlargable';
        var messageinfo = document.createElement('p');
        var user = {
            displayName: 'Unknown'
        };
        database.ref('users/' + m.user).once('value').then(function (snap) {
            user = snap.val();
            var span = document.createElement('span');
            span.innerText = user.displayName;
            span.className = 'chat-username';
            for (var trait in user.traits) {
                if (user.traits[trait]) {
                    var s = document.createElement('span');
                    s.className = 'trait ' + '_' + trait;
                    span.appendChild(s);
                }
            }
            var span2 = document.createElement('span');
            span2.innerText = ' at ' + m.time;
            messageinfo.appendChild(span);
            messageinfo.appendChild(span2);
            image.src = user.photoURL;
        }).catch(function (err) {
            console.log(err);
        });
        messageinfo.className = 'message-info';
        var image = document.createElement('img');
        image.className = 'profile-picture enlargable';
        image.height = 45;
        var wrapper = document.createElement('div');
        wrapper.className = 'message';
        wrapper.appendChild(image);
        wrapper.appendChild(p);
        wrapper.appendChild(messageinfo);
        return wrapper;
    }
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
                    that.ref.child('topics').child(topic).child('chat').on('child_added', function (snap) {
                        var el = that.getMessageElement(snap.val());
                        that.elements.chatBody.append(el);
                    });
                    that.data.render();
                });
                that.elements.topics.append(p);
            }
            that.elements.nothingHere.hide();
        };
        that.data.render();
        $('#home-topic').addClass('selected');
        that.elements.chatInput.on('keyup', function (e) {
            var key = e.key.toLowerCase();
            if (key == 'enter' && that.elements.chatInput.val().length < 150 && auth.currentUser) {
                var d = new Date();
                var chat = {
                    message: that.elements.chatInput.val(),
                    user: auth.currentUser.uid,
                    time: d.toLocaleTimeString() + ' ' + d.toLocaleDateString()
                };
                that.ref.child('topics').child(that.currentTopic).child('chat').push().set(chat);
                that.elements.chatInput.val('');
            }
        })
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

auth.onAuthStateChanged(function (user) {
    if (user) {
        //yeet
    } else {
        auth.signInWithPopup(new firebase.auth.GoogleAuthProvider());
    }
});
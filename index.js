function Site(ref) {
    var that = this;
    this.elements = {
        blitzboardTitle: $('#blitzboard-title'),
        topics: $('#more-topics'),
        mainContent: $('#main-content'),
        posts: $('#posts'),
        chat: $('#chat'),
        chatInput: $('#chat-input'),
        chatBodies: $('#chat-bodies'),
        nothingHere: $('#nothing-here'),
        newPostName: $('#new-post-name'),
        newPostContent: $('#new-post-content'),
        newPostTopics: $('#new-post-topics')
    }
    this.ref = ref;
    this.data = {};
    if (!this.ref) {
        return;
    }
    this.currentTopic = 'Home';
    $('#topic-home').click(function () {
        that.elements.posts.addClass('expanded');
    });
    this.getMessageElement = function (m) {
        var p = document.createElement('div');
        p.innerText = m.message;
        p.className = 'message-body enlargable';
        var messageinfo = document.createElement('div');
        var user = {
            displayName: 'Unknown'
        };
        database.ref('users/' + m.user).once('value').then(function (snap) {
            user = snap.val();
            var span = document.createElement('span');
            span.innerText = user.displayName;
            span.className = 'chat-username';
            var span2 = document.createElement('span');
            span2.innerText = ' at ' + m.time;
            span2.className = 'message-info--time';
            messageinfo.appendChild(span);
            messageinfo.appendChild(span2);
            image.src = user.photoURL;
        }).catch(function (err) {
            console.log(err);
        });
        messageinfo.className = 'message-info';
        var image = document.createElement('img');
        image.className = 'profile-picture enlargable';
        var wrapper = document.createElement('div');
        wrapper.className = 'message';
        var imageAndMessageWrapper = document.createElement('div');
        imageAndMessageWrapper.appendChild(image);
        imageAndMessageWrapper.appendChild(p);
        wrapper.appendChild(imageAndMessageWrapper);
        wrapper.appendChild(messageinfo);
        return wrapper;
    }
    this.ref.once('value').then(function (snap) {
        that.data = snap.val();
        that.data.render = function () {
            that.elements.topics.text('');
            that.elements.blitzboardTitle.text(':: ' + that.currentTopic + ' - ' + that.data.name);
            that.elements.newPostTopics.text('');
            $('.topic-item').each(function () {
                this.classList.remove('selected');
            });
            for (var topic in that.data.topics) {
                var p = document.createElement('div');
                p.className = 'topic-item';
                if (topic == that.currentTopic)
                    p.classList.add('selected');
                p.innerText = topic;
                p.id = 'topic-' + topic;
                var option = document.createElement('option');
                option.innerText = ':: ' + topic;
                that.elements.topics.append(p);
                that.elements.newPostTopics.append(option);
            }
            $('.chat-body').each(function () {
                $(this).hide();
            });
            $('#chat-body-' + that.currentTopic).show();
            $('.topic-item').not('#topic-home').each(function () {
                this.addEventListener('click', function () {
                    var topic = this.id.slice(6);
                    that.currentTopic = topic;
                    if (!document.querySelector('#chat-body-' + topic)) {
                        var newChatBody = document.createElement('div');
                        newChatBody.id = 'chat-body-' + topic;
                        newChatBody.className = 'chat-body';
                        that.ref.child('topics').child(topic).child('chat').on('child_added', function (snap) {
                            var el = that.getMessageElement(snap.val());
                            newChatBody.appendChild(el);
                            that.elements.chatBodies.scrollTop(that.elements.chatBodies.height());
                        });
                        that.elements.chatBodies.append(newChatBody);
                    }
                    that.elements.posts.removeClass('expanded');
                    that.data.render();
                });
            });
            that.elements.chatBodies.scrollTop(that.elements.chatBodies.height());
            that.elements.nothingHere.hide();
        };
        that.data.render();
        $('#home-topic').addClass('selected');
    }).catch(function (err) {
        document.body.innerHTML = 'Sorry, a database error occured. (' + err + ').';
    });
    this.elements.chatInput.on('keyup', function (e) {
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
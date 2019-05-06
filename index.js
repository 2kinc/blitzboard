function Site(ref) {
    var that = this;
    this.elements = {
        blitzboardTitle: $('#blitzboard-title'),
        topics: $('#more-topics'),
        mainContent: $('#main-content'),
        posts: $('#posts'),
        postsBodies: $('#posts-bodies'),
        chat: $('#chat'),
        chatInput: $('#chat-input'),
        chatBodies: $('#chat-bodies'),
        loading: $('#loading'),
        newPostWrapper: $('#new-post-wrapper'),
        newPostButton: $('#new-post-button'),
        newPostName: $('#new-post-name'),
        newPostContent: $('#new-post-content'),
        newPostTopicsWrapper: $('#new-post-topics-wrapper'),
        newPostTopics: $('#new-post-topics'),
        newPostUpload: document.querySelector('#new-post-upload'),
        newPostUploadLabel: $('#new-post-upload-label'),
        newPostMain: $('#new-post-main')
    }
    this.ref = ref;
    this.data = {};
    if (!this.ref) {
        return;
    }
    this.currentTopic = 'home';
    this.getMessageElement = function (ref) {
        var m = ref.val();
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
        image.className = 'profile-picture';
        var wrapper = document.createElement('div');
        wrapper.className = 'message';
        var imageAndMessageWrapper = document.createElement('div');
        imageAndMessageWrapper.appendChild(image);
        imageAndMessageWrapper.appendChild(p);
        wrapper.appendChild(imageAndMessageWrapper);
        wrapper.appendChild(messageinfo);
        return wrapper;
    }
    function addTo(ref) {
        ref.once('value').then(function (snap) {
            var d = snap.val();
            ref.set(d + 1);
            return d + 1;
        });
    }
    this.getPostElement = function (ref) {
        var p = ref.val();
        if (!p.content || !p.user)
            return document.createElement('div');
        var wrapper = document.createElement('div');
        wrapper.className = 'post-wrapper k-card';
        var title = document.createElement('span');
        title.className = 'post-title k-card-title';
        title.innerText = p.name;
        var topWrapper = document.createElement('div');
        var topicsWrapper = document.createElement('span');
        topicsWrapper.className = 'float-right post-topics-wrapper';
        for (var topic in p.topics) {
            var span = document.createElement('span');
            span.className = 'post-topic-item';
            span.innerText = '::' + p.topics[topic];
            topicsWrapper.appendChild(span);
        }
        topWrapper.appendChild(title);
        topWrapper.appendChild(topicsWrapper);
        var content = document.createElement('div');
        content.className = 'post-content k-card-content';
        content.innerText = p.content;
        if (p.content.indexOf("https://firebasestorage.googleapis.com/") == 0
            || p.content.indexOf("https://lh3.googleusercontent.com/") == 0
            || p.content.indexOf("http://pbs.twimg.com/") == 0
            || p.content.indexOf("data:image/") == 0) {
            var imgElm = document.createElement("img");
            imgElm.className = 'post-img';
            imgElm.src = p.content;
            // var outer = document.createElement("div");
            // outer.className = 'post-img-container';
            // outer.appendChild(imgElm);
            // content.appendChild(outer);
            content.insertBefore(imgElm, content.firstChild);
            content.style.fontSize = '0.6em';
        }
        var bottom = document.createElement('div');
        bottom.className = 'post-bottom k-card-bottom';
        var plusButton = document.createElement('button');
        plusButton.className = 'k-button plus-button';
        plusButton.innerText = '+1';
        plusButton.onclick = function () {
            var votesRef = that.ref.child('users').child(auth.currentUser.uid).child('votes').child(that.ref.key).child(ref.key);
            votesRef.once('value', function (snap) {
                if (snap.val() != true) {
                    addTo(ref.ref.child('pluses'));
                    votesRef.set(true);
                }
            });
        };
        var minusButton = document.createElement('button');
        minusButton.className = 'k-button minus-button';
        minusButton.innerText = '-1';
        minusButton.onclick = function () {
            var votesRef = that.ref.child('users').child(auth.currentUser.uid).child('votes').child(that.ref.key).child(ref.key);
            votesRef.once('value', function (snap) {
                if (snap.val() != true) {
                    addTo(ref.ref.child('minuses'));
                    votesRef.set(true);
                }
            });
        };
        ref.ref.child('pluses').on('value', function (snap) {
            var pluses = snap.val();
            ref.ref.child('minuses').once('value').then(function (snap) {
                var sum = pluses - snap.val();
                points.innerText = sum;
            })
        });
        ref.ref.child('minuses').on('value', function (snap) {
            var minuses = snap.val();
            ref.ref.child('pluses').once('value').then(function (snap) {
                var sum = snap.val() - minuses;
                points.innerText = sum;
            });
        });
        var points = document.createElement('span');
        points.className = 'post-points';
        points.innerText = p.pluses - p.minuses;
        bottom.appendChild(plusButton);
        database.ref('users/' + p.user).once('value').then(function (snap) {
            var user = snap.val();
            title.innerText += ' - ' + user.displayName;
        }).catch(function (err) {
            console.log(err);
        });
        var comments = document.createElement('div');
        ref.ref.child('comments').on('child_added', function (snap) {
            var comment = that.getMessageElement(snap);
            comments.appendChild(comment);
        });
        wrapper.appendChild(topWrapper);
        wrapper.appendChild(content);
        bottom.appendChild(plusButton);
        bottom.appendChild(points);
        bottom.appendChild(minusButton);
        bottom.appendChild(comments);
        wrapper.appendChild(bottom);
        return wrapper;
    }
    this.ref.once('value').then(function (snap) {
        that.data = snap.val();
        that.data.render = function () {
            that.elements.topics.html('');
            that.elements.blitzboardTitle.text(':: ' + that.currentTopic + ' - ' + that.data.name);
            that.elements.newPostTopics.html('');
            var autofocus = document.createElement('option');
            autofocus.innerText = 'Select a topic';
            autofocus.setAttribute('autofocus', 'true');
            that.elements.newPostTopics.append(autofocus);
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
                option.id = 'option-' + topic;
                that.elements.topics.append(p);
                that.elements.newPostTopics.append(option);
            }
            if (that.currentTopic == 'home') {
                $('#topic-home').addClass('selected');
                if (!document.querySelector('#posts-body-home')) {
                    var newPostsBody = document.createElement('div');
                    newPostsBody.id = 'posts-body-home';
                    newPostsBody.className = 'posts-body';
                    that.elements.postsBodies.append(newPostsBody);
                    that.ref.child('posts').orderByChild('pluses').on('child_added', function (snap) {
                        var postEl = that.getPostElement(snap);
                        newPostsBody.insertBefore(postEl, newPostsBody.firstChild);
                    });
                }
                that.elements.posts.addClass('expanded');
            }
            $('.chat-body').each(function () {
                $(this).hide();
            });
            $('#chat-body-' + that.currentTopic).show();
            $('.posts-body').each(function () {
                $(this).hide();
            });
            $('#posts-body-' + that.currentTopic).show();
            $('.topic-item').not('#topic-home').each(function () {
                this.addEventListener('click', function () {
                    var topic = this.id.slice(6);
                    that.currentTopic = topic;
                    if (!document.querySelector('#chat-body-' + topic)) {
                        var newChatBody = document.createElement('div');
                        newChatBody.id = 'chat-body-' + topic;
                        newChatBody.className = 'chat-body';
                        that.ref.child('topics').child(topic).child('chat').on('child_added', function (snap) {
                            var el = that.getMessageElement(snap);
                            newChatBody.appendChild(el);
                            that.elements.chatBodies.scrollTop(1000000);
                        });
                        that.elements.chatBodies.append(newChatBody);
                    }
                    if (!document.querySelector('#posts-body-' + topic)) {
                        var newPostsBody = document.createElement('div');
                        newPostsBody.id = 'posts-body-' + topic;
                        newPostsBody.className = 'posts-body';
                        that.elements.postsBodies.append(newPostsBody);
                        that.ref.child('posts').orderByChild('pluses').on('child_added', function (snap) {
                            var post = snap.val();
                            if (post.topics && post.topics.includes(topic)) {
                                var postEl = that.getPostElement(snap);
                                newPostsBody.insertBefore(postEl, newPostsBody.firstChild);
                            }
                        });
                    }
                    that.elements.posts.removeClass('expanded');
                    that.data.render();
                });
            });
            $('#topic-home').click(function () {
                if (!document.querySelector('#posts-body-home')) {
                    var newPostsBody = document.createElement('div');
                    newPostsBody.id = 'posts-body-home';
                    newPostsBody.className = 'posts-body';
                    that.elements.postsBodies.append(newPostsBody);
                    that.ref.child('posts').orderByChild('pluses').on('child_added', function (snap) {
                        var postEl = that.getPostElement(snap);
                        newPostsBody.insertBefore(postEl, newPostsBody.firstChild);
                    });
                }
                that.elements.posts.addClass('expanded');
                that.currentTopic = 'home';
                that.data.render();
            })
            that.elements.chatBodies.scrollTop(that.elements.chatBodies.height());
            that.elements.loading.hide();
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
    var topics = [];
    this.elements.newPostButton.click(function () {
        if (that.elements.newPostMain.hasClass('shown')) {
            if (that.elements.newPostName.val() == '')
                that.elements.newPostName.val('[untitled post]')
            var post = {
                name: that.elements.newPostName.val(),
                content: that.elements.newPostContent.val(),
                topics: topics,
                pluses: 0,
                minuses: 0,
                user: auth.currentUser.uid
            };
            that.ref.child('posts').push().set(post);
            that.elements.newPostName.val('');
            that.elements.newPostContent.val('');
            that.elements.newPostTopicsWrapper.text('');
            topics = [];
            that.elements.newPostTopics.text('');
            var autofocus = document.createElement('option');
            autofocus.innerText = 'Select a topic';
            autofocus.setAttribute('autofocus', 'true');
            that.elements.newPostTopics.append(autofocus);
            for (var topic in that.data.topics) {
                var p = document.createElement('div');
                p.className = 'topic-item';
                if (topic == that.currentTopic)
                    p.classList.add('selected');
                p.innerText = topic;
                p.id = 'topic-' + topic;
                var option = document.createElement('option');
                option.innerText = ':: ' + topic;
                option.id = 'option-' + topic;
                that.elements.topics.append(p);
                that.elements.newPostTopics.append(option);
            }
        }
        that.elements.newPostMain.toggleClass('shown');
        that.elements.newPostButton.toggleClass('k-rainbow');
    });
    this.elements.newPostTopics.change(function (e) {
        var topic = that.elements.newPostTopics.val().slice(3);
        if (topic != 'ect a topic') {
            var span = document.createElement('span');
            span.innerText = topic;
            span.className = 'new-post-topic k-capsule';
            that.elements.newPostTopicsWrapper.append(span);
            topics.push(topic);
            $('#option-' + topic).remove();
        }
    });
};

var app = firebase;
var database = app.database();
var auth = app.auth();
var storage = app.storage();
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
var app = new Vue({
    el: '#app',
    data: {
        firebase: null
    },
    mounted: function(){
        this.firebase = firebase;
    }
});

Vue.component("chat-body", {
    template: '#chat-body-template',
    data: () => ({
        messages: [],
        users: []
    }),

    mounted() {
        this.getMessages();
    },

    methods: {
        getMessages() {
            site.ref.child('topics').child(topic).child('chat').on('child_added', function (snap) {
                var s = snap.val();
                if(!this.users.contains(s.userId))
                {
                    this.users.push(fetchUser(s.userId));
                }
                var mm = this.composeMessageObject(s, this.users[s.userId])
                this.messages.push(mm);
            });
        },
        fetchUser: function(userId){
            return null;
        }
    }
});

auth.onAuthStateChanged(function (user) {
    if (user) {
        //yeet
        site.ref.child('users').once('value').then(function (snap) {
            if (snap.val() == null)
                site.ref.child('users').child(auth.currentUser.uid).set(true);
        })
    } else {
        auth.signInWithPopup(new firebase.auth.GoogleAuthProvider());
    }
});

var inputs = document.querySelectorAll('.inputfile');
Array.prototype.forEach.call(inputs, function (input) {
    var label = input.nextElementSibling,
        labelVal = label.innerHTML;

    input.addEventListener('change', function (e) {
        var fileName = '';
        if (this.files && this.files.length > 1)
            fileName = (this.getAttribute('data-multiple-caption') || '').replace('{count}', this.files.length);
        else
            fileName = e.target.value.split('\\').pop();

        if (fileName)
            label.innerHTML = fileName;
        else
            label.innerHTML = labelVal;
    });
});

function handleFileForNewPost(e) {
    var file = site.elements.newPostUpload.files[0]; //the file
    var storageRef = storage.ref('blitzboard_uploads'); //where the files live
    var uploadRef = storageRef.child(file.name); //the file that we are uploading
    var uploadTask = uploadRef.put(file)
        .then(snapshot => {
            return snapshot.ref.getDownloadURL();   // Will return a promise with the download link
        })

        .then(downloadURL => {
            site.elements.newPostContent.val(downloadURL);
            return downloadURL;
        })

        .catch(error => {
            // Use to signal error if something goes wrong.
            console.log(`Failed to upload file and get link - ${error}`);
        });
}

site.elements.newPostUpload.addEventListener('input', handleFileForNewPost);
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
        chatInputButton: $('#chat-input-button'),
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
        newPostMain: $('#new-post-main'),
        drawerTitle: $('#drawer-title'),
        drawerSubtitle: $('#drawer-subtitle'),
        blitzboardDescription: $('#blitzboard-description'),
        memberCount: $('#member-count')
    }
    this.ref = ref;
    this.data = {};
    if (!this.ref) {
        return;
    }
    this.currentTopic = 'home';
    this.initializeTopicOption = function (topic) {
        if (topic != 'home') {
            var option = document.createElement('option');
            option.innerText = '::' + topic;
            option.id = 'option-' + topic;
            that.elements.newPostTopics.append(option);
        }
    };
    this.initializeTopicElements = function (topic) {
        if (topic != 'home') {
            var item = document.createElement('li');
            item.className = 'topic-item mdc-list-item';
            if (topic == that.currentTopic)
                item.classList.add('mdc-list-item--selected');
            item.innerText = '::' + topic;
            item.id = 'topic-' + topic;
            that.elements.topics.append(item);
            that.initializeTopicOption(topic);
        }
    };
    this.ref.once('value').then(function (snap) {
        that.data = snap.val();
        that.data.render = function () {
            that.elements.topics.html('');
            that.elements.blitzboardTitle.text('::' + that.currentTopic + ' - ' + that.data.name);
            that.elements.drawerTitle.text(that.data.name);
            that.elements.blitzboardDescription.text(that.data.description || 'This Blitzboard has no description.');
            //that.elements.memberCount.text(Object.keys(that.data.users).length + ' members');
            that.elements.newPostTopics.html('');
            var autofocus = document.createElement('option');
            autofocus.innerText = 'Select a topic';
            autofocus.setAttribute('autofocus', 'true');
            that.elements.newPostTopics.append(autofocus);
            $('.topic-item').each(function () {
                this.classList.remove('selected');
            });
            var ChatBody = Vue.extend(chatBodyComponent);
            var PostsBody = Vue.extend(postsBodyComponent);
            for (var topic in that.data.topics) {
                that.initializeTopicElements(topic);
            }
            if (that.currentTopic == 'home') {
                $('#topic-home').addClass('selected');
                if (!document.querySelector('#posts-body-home')) {
                    var newPostsBody = document.createElement('div');
                    newPostsBody.id = 'posts-body-' + topic;
                    //newPostsBody.className = 'posts-body';
                    that.elements.postsBodies.append(newPostsBody);
                    var component = new PostsBody();
                    component.topic = topic;
                    component.dbref = that.ref.child('posts').orderByChild('pluses');
                    component.$mount('#' + newPostsBody.id);
                    /*that.ref.child('posts').orderByChild('pluses').on('child_added', function (snap) {
                        var post = snap.val();
                        if (post.topics && post.topics.includes(topic)) {
                            var postEl = that.getPostElement(snap);
                            newPostsBody.insertBefore(postEl, newPostsBody.firstChild);
                        }
                    });*/
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
                    drawer.open = false;
                    document.querySelector('.mdc-drawer').classList.add('mdc-drawer--closing');
                    that.elements.newPostButton.focus();
                    var topic = this.id.slice(6);
                    that.currentTopic = topic;
                    if (!document.querySelector('#chat-body-' + topic)) {
                        var newChatBody = document.createElement('div');
                        newChatBody.id = 'chat-body-' + topic;
                        that.elements.chatBodies.append(newChatBody);
                        var component = new ChatBody();
                        component.topic = topic;
                        component.$mount('#' + newChatBody.id);
                    }
                    if (!document.querySelector('#posts-body-' + topic)) {
                        var newPostsBody = document.createElement('div');
                        newPostsBody.id = 'posts-body-' + topic;
                        that.elements.postsBodies.append(newPostsBody);
                        var component = new PostsBody();
                        component.topic = topic;
                        component.dbref = that.ref.child('posts').orderByChild('pluses');
                        component.$mount('#' + newPostsBody.id);
                    }
                    that.elements.posts.removeClass('expanded');
                    that.data.render();
                });
            });
            $('#topic-home').click(function () {
                if (!document.querySelector('#posts-body-home')) {
                    var newPostsBody = document.createElement('div');
                    newPostsBody.id = 'posts-body-' + topic;
                    //newPostsBody.className = 'posts-body';
                    that.elements.postsBodies.append(newPostsBody);
                    var component = new PostsBody();
                    component.topic = topic;
                    component.dbref = that.ref.child('posts').orderByChild('pluses');
                    component.$mount('#' + newPostsBody.id);
                    /*that.ref.child('posts').orderByChild('pluses').on('child_added', function (snap) {
                        var post = snap.val();
                        if (post.topics && post.topics.includes(topic)) {
                            var postEl = that.getPostElement(snap);
                            newPostsBody.insertBefore(postEl, newPostsBody.firstChild);
                        }
                    });*/
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
        if (key == 'enter' && that.elements.chatInput.val().length < 150 && auth.currentUser && that.elements.chatInput.val() != '') {
            var d = new Date();
            var chat = {
                message: that.elements.chatInput.val(),
                user: auth.currentUser.uid,
                time: d.getTime()
            };
            that.ref.child('topics').child(that.currentTopic).child('chat').push().set(chat);
            that.elements.chatInput.val('');
        }
    });
    this.elements.chatInputButton.click(function (e) {
        if (that.elements.chatInput.val().length < 150 && auth.currentUser && that.elements.chatInput.val() != '') {
            var d = new Date();
            var chat = {
                message: that.elements.chatInput.val(),
                user: auth.currentUser.uid,
                time: d.getTime()
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
                that.initializeTopicElements(topic);
            }
        }
        that.elements.newPostMain.toggleClass('shown');
    });
    this.elements.newPostTopics.change(function (e) {
        var topic = that.elements.newPostTopics.val().slice(2);
        if (topic != 'lect a topic') {
            var chip = document.createElement('div');
            chip.className = 'mdc-chip';
            var text = document.createElement('div');
            text.className = 'mdc-chip__text';
            text.innerText = topic;
            var icon = document.createElement('i');
            icon.className = 'material-icons mdc-chip__icon mdc-chip__icon--trailing';
            icon.innerText = 'cancel';
            icon.role = 'button';
            icon.tabIndex = 0;
            icon.addEventListener('click', function () {
                that.initializeTopicOption(topic);
                topics.pop(topic);
            });
            chip.appendChild(text);
            chip.appendChild(icon);
            mdc.chips.MDCChip.attachTo(chip);
            that.elements.newPostTopicsWrapper.append(chip);
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

var vue = new Vue({
    el: '#app',
    data: {
        users: {},
        members: []
    },
    mounted: function () {
        this.firebase = app;
        if (site) {
            this.dbref = site.ref;
        }
        this.attachMDCStyles();
    },
    methods: {
        attachMDCStyles: function () {
            const buttons = document.querySelectorAll('.mdc-button, mdc-icon-button');
            for (var button of buttons) {
                mdc.ripple.MDCRipple.attachTo(button);
            }
            const textFields = document.querySelectorAll('.mdc-text-field');
            for (const textField of textFields) {
                mdc.textField.MDCTextField.attachTo(textField);
            }
            const selects = document.querySelectorAll('.mdc-select');
            for (const select of selects) {
                mdc.select.MDCSelect.attachTo(select);
            }
            const chips = document.querySelectorAll('.mdc-chip');
            for (const chip of chips) {
                mdc.chips.MDCChip.attachTo(chip);
            }
        },
        getMembers: function () {
            var vueThis = this;
            this.dbref.child('users').on('child_added', function (snap) {
                var member = snap.val();
                member.id = snap.key;
                vueThis.members.push(member);
            });
            this.dbref.child('users').on('child_changed', function (snap) {
                var member = snap.val();
                member.id = snap.key;
                var oldMember = vueThis.members.filter(filteredMember => filteredMember.id == member.id)[0];
                vueThis.members[vueThis.members.indexOf(oldMember)] = member;
            });
        },
        initializePresenceRef: function (userid) {
            var amOnline = database.ref('.info/connected');
            var userRef = this.dbref.child('users').child(userid).child('presence');
            amOnline.on('value', function (snapshot) {
                if (snapshot.val()) {
                    userRef.onDisconnect().remove();
                    userRef.set(true);
                }
            });
        }
    },
    computed: {
        onlineMembers: function () {
            return this.members.filter(member => member.presence == true);
        }
    }
});

var chatBodyComponent = Vue.component("chat-body", {
    template: '#chat-body-template',
    data: () => ({
        messages: [],
        topic: ''
    }),

    mounted() {
        this.getMessages();
    },

    methods: {
        getMessages: function () {
            var vueThis = this;
            site.ref.child('topics').child(vueThis.topic).child('chat').on('child_added', function (snap) {
                var s = snap.val();
                s.time = new Date(s.time).toLocaleString();
                s.id = snap.key;

                if (!vue.users[s.user]) {
                    vueThis.fetchUserAndPushMessage(s, s.user);
                    return;
                } else {
                    var mm = vueThis.composeMessageObject(s, vue.users[s.user]);
                    vueThis.messages.push(mm);
                    return;
                }
            });
            site.ref.child('topics').child(vueThis.topic).child('chat').limitToLast(1).on('child_added', function () {
                vue.attachMDCStyles();
            });
        },
        fetchUserAndPushMessage: function (message, uid) {
            var vueThis = this;
            database.ref('users/' + uid).once('value').then(function (snap) {
                var mm = vueThis.composeMessageObject(message, snap.val());
                vue.users[uid] = snap.val();
                vueThis.messages.push(mm);
            });
        },
        composeMessageObject: function (s, u) {
            if (s && u) {
                var object = Object.assign(s, {
                    displayName: u.displayName,
                    photoURL: u.photoURL
                });
                return object;
            }
        }
    },
    computed: {
        sortedMessages: function () {
            function compare(a, b) {
                if (new Date(a.time).getTime() > new Date(b.time).getTime()) {
                    return 1;
                }
                if (new Date(a.time).getTime() < new Date(b.time).getTime()) {
                    return -1;
                }
                return 0;
            }

            return this.messages.sort(compare);
        }
    }
});

var messageWrapperComponent = Vue.component('message-wrapper', {
    template: '#message-wrapper-template',
    props: {
        message: Object
    },
    data: () => ({

    }),
    mounted() {
        this.attachMDCStyles();
        this.scrollToEnd();
    },
    methods: {
        attachMDCStyles: function () {
            mdc.ripple.MDCRipple.attachTo(this.$refs.messageBody);
        },
        scrollToEnd: function () {
            var container = document.querySelector('#chat-bodies');
            container.scrollTop = container.scrollHeight;
        }
    }
});

var postsBodyComponent = Vue.component("posts-body", {
    template: '#posts-body-template',
    data: function () {
        return {
            posts: [],
            topic: ''
        };
    },

    mounted() {
        this.getPosts();
    },

    methods: {
        getPosts: function () {
            var vueThis = this;
            this.dbref.on('child_added', function (snap) {
                var s = snap.val();
                if (s.topics && s.topics.includes(vueThis.topic)) {
                    s.id = snap.key;

                    if (!vue.users[s.user]) {
                        vueThis.fetchUserAndPushPost(s, s.user);
                    } else {
                        var mm = vueThis.composePostObject(s, vue.users[s.user]);
                        vueThis.posts.push(mm);
                    }
                }
            });
        },
        fetchUserAndPushPost: function (post, uid) {
            var vueThis = this;
            database.ref('users/' + uid).once('value').then(function (snap) {
                var mm = vueThis.composePostObject(post, snap.val());
                vue.users[uid] = snap.val();
                vueThis.posts.push(mm);
            });
        },
        composePostObject: function (s, u) {
            if (s && u) {
                var object = Object.assign(s, {
                    displayName: u.displayName,
                    photoURL: u.photoURL
                });
                return object;
            }
        }
    },
});

var postWrapperComponent = Vue.component('post-wrapper', {
    template: '#post-wrapper-template',
    props: {
        dbref: Object,
        post: {
            type: Object,
            default: {
                pluses: 0,
                minuses: 0,
                content: 'Loading...',
                name: 'Loading...',
                displayName: 'Loading...',
                topics: []
            }
        }
    },
    data: () => ({

    }),

    mounted() {
        this.getContent();
        this.attachMDCStyles();
    },

    methods: {
        getContent: function () {
            var vueThis = this;
            this.dbref.child('pluses').on('value', function (snap) {
                vueThis.post.pluses = snap.val();
            });
            this.dbref.child('minuses').on('value', function (snap) {
                vueThis.post.minuses = snap.val();
            });
            var urlRegex = /(https?:\/\/[^\s]+)/g;
            this.post.content = this.post.content.replace(urlRegex, function (url) {
                if (url.indexOf("https://firebasestorage.googleapis.com/") == 0
                    || url.indexOf("https://lh3.googleusercontent.com/") == 0
                    || url.indexOf("http://pbs.twimg.com/") == 0
                    || url.indexOf("data:image/") == 0) {
                    vueThis.post.imageURL = url;
                    vueThis.$el.classList.add('has-image');
                    return '';
                }
                return url;
            });
        },
        addPlus: function () {
            var vueThis = this;
            var votesRef = site.ref.child('users').child(auth.currentUser.uid).child('votes').child(site.ref.key).child(vueThis.dbref.key);
            votesRef.once('value', function (snap) {
                var vote = snap.val();
                if (!vote || vote === true) {
                    vueThis.post.pluses++;
                    vueThis.dbref.child('pluses').set(vueThis.post.pluses);
                    votesRef.set(1);
                } else if (vote === (-1)) {
                    vueThis.post.pluses++;
                    vueThis.dbref.child('pluses').set(vueThis.post.pluses);
                    vueThis.post.minuses--;
                    vueThis.dbref.child('minuses').set(vueThis.post.minuses);
                    votesRef.set(1);
                }
            });
        },
        addMinus: function () {
            var vueThis = this;
            var votesRef = site.ref.child('users').child(auth.currentUser.uid).child('votes').child(site.ref.key).child(vueThis.dbref.key);
            votesRef.once('value', function (snap) {
                var vote = snap.val();
                if (!vote || vote === true) {
                    vueThis.post.minuses++;
                    vueThis.dbref.child('pluses').set(vueThis.post.minuses);
                    votesRef.set(-1);
                } else if (vote === 1) {
                    vueThis.post.minuses++;
                    vueThis.dbref.child('minuses').set(vueThis.post.minuses);
                    vueThis.post.pluses--;
                    vueThis.dbref.child('pluses').set(vueThis.post.pluses);
                    votesRef.set(-1);
                }
            });
        },
        attachMDCStyles: function () {
            var mdcbuttons = [this.$refs.plusButton, this.$refs.minusButton];
            mdcbuttons.forEach(function (mdcbutton) {
                mdc.ripple.MDCRipple.attachTo(mdcbutton);
            });
        }
    }
});

/** Initialize MDC Web components. */

var site = new Site(new Blitzboard('test', 'test.').ref);
vue.dbref = site.ref;
vue.getMembers();

auth.onAuthStateChanged(function (user) {
    if (user) {
        //yeet
        site.ref.child('users').once('value').then(function (snap) {
            if (snap.val() == null)
                site.ref.child('users').child(auth.currentUser.uid).set(true);
        });
        vue.initializePresenceRef(auth.currentUser.uid);
    } else {
        auth.signInWithRedirect(new firebase.auth.GoogleAuthProvider());
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
vue.attachMDCStyles();

var topAppBar = mdc.topAppBar.MDCTopAppBar.attachTo(document.querySelector('#navbar'));
var drawer = new mdc.drawer.MDCDrawer(document.querySelector('#drawer'));
var mainContentEl = document.querySelector('#mdc-drawer-frame-content');
var listEl = document.querySelector('.mdc-drawer .mdc-list');

topAppBar.setScrollTarget(mainContentEl);
document.querySelector('.mdc-top-app-bar__navigation-icon').addEventListener('click', () => drawer.open = true);

document.body.addEventListener('MDCDrawer:closed', () => {
    site.elements.newPostButton.focus();
});

$('.mdc-drawer-scrim').click(() => {
    $('#drawer').addClass('mdc-drawer--closing');
});
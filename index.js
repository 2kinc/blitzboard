var app = firebase;
var database = app.database();
var auth = app.auth();
var storage = app.storage();
var blitzboardRef = database.ref('blitzboard');

const baseURL = 'https://2kinc.me/blitzboard';

function Blitzboard(id, name, currentTopic) {
    var that = this;
    this.id = id;
    this.name = name;
    this.currentTopic = currentTopic;
    this.ref = database.ref('blitzboard/' + this.id);
    this.ref.once('value').then(function (snap) {
        if (snap.val())
            return;
        that.ref.child('name').set(that.name);
    });
}
mdc.autoInit();
var vue = new Vue({
    el: '#app',
    data: {
        loaded: false,
        users: {},
        members: [],
        topics: [],
        currentTopic: 'home',
        name: 'Blitzboard',
        description: 'This Blitzboard has no description.',
        postForm: {
            topics: [],
            name: '[untitled post]',
            content: '',
            user: null,
            pluses: 0,
            minuses: 0
        },
        mydata: null,
        availableTopics: [],
        chatMessage: '',
        readyToPushPost: false,
        currentUser: {}
    },
    mounted: function () {
        this.firebase = app;
        this.attachMDCStyles();
    },
    methods: {
        attachMDCStyles: function () {
            const ripples = document.querySelectorAll('.mdc-button, .mdc-icon-button, .mdc-list-item');
            for (var ripple of ripples) {
                var mdcripple = new mdc.ripple.MDCRipple(ripple);
                if (ripple.classList.contains("mdc-icon-button")) {
                    mdcripple.unbounded = true;
                }
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
                database.ref('users/' + member.id).once('value').then(function (snap) {
                    member = Object.assign(member, snap.val());
                    vueThis.members.push(member);
                });
            });
            this.dbref.child('users').on('child_changed', function (snap) {
                var member = snap.val();
                member.id = snap.key;
                var index = vueThis.members.indexOf(vueThis.members.filter(filteredMember => filteredMember.id == member.id)[0]);
                vueThis.members.splice(index, 1, member);
            });
        },
        getTopics: function () {
            var vueThis = this;
            this.dbref.child('topics').on('child_added', function (snap) {
                vueThis.topics.push(snap.key);
                if (snap.key != 'home') {
                    vueThis.postForm.topics.push(snap.key);
                    vueThis.availableTopics.push(snap.key);
                }
            });
            $('#posts-body-' + this.currentTopic).show();
        },
        getBlitzboardInfo: function () {
            var vueThis = this;
            this.dbref.child('name').on('value', function (snap) {
                vueThis.name = snap.val();
            });
            this.dbref.child('description').on('value', function (snap) {
                vueThis.description = snap.val();
            });
        },
        getMyRolesAndData: function () {
            var vueThis = this;
            ref = database.ref('users/' + this.currentUser.uid + '/blitzboards/' + this.dbref.key);
            ref.on('value', function (snap) {
                var data = snap.val();
                vueThis.mydata = data;
                if (data == null) {
                    vueThis.$refs.welcome.style.display = "block";
                }
            });
        },
        getAllData: function () {
            this.getMembers();
            this.getTopics();
            this.getBlitzboardInfo();
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
        },
        goToTopic: function (topic) {
            var ChatBody = Vue.extend(chatBodyComponent);
            var PostsBody = Vue.extend(postsBodyComponent);
            router.push('/' + this.dbref.key + '/::' + topic);
            drawer.open = false;
            document.querySelector('.mdc-drawer').classList.add('mdc-drawer--closing');
            this.currentTopic = topic;
            if (!document.querySelector('#chat-body-' + topic)) {
                var newChatBody = document.createElement('div');
                newChatBody.id = 'chat-body-' + topic;
                this.$refs.chatBodies.appendChild(newChatBody);
                var component = new ChatBody();
                component.topic = topic;
                component.$mount('#' + newChatBody.id);
            }
            if (!document.querySelector('#posts-body-' + topic)) {
                var newPostsBody = document.createElement('div');
                newPostsBody.id = 'posts-body-' + topic;
                this.$refs.postsBodies.appendChild(newPostsBody);
                var component = new PostsBody();
                component.topic = topic;
                component.dbref = this.dbref.child('posts').orderByChild('pluses');
                component.$mount('#' + newPostsBody.id);
            }
            this.$refs.posts.classList.remove('expanded');
        },
        closePost: function () {
            this.readyToPushPost = false;
        },
        pushPost: function () {
            if (this.readyToPushPost) {
                this.postForm.user = auth.currentUser.uid;
                this.dbref.child('posts').push().set(this.postForm);
                this.readyToPushPost = false;
            } else {
                this.readyToPushPost = true;
            }
        },
        pushChatMessage: function (e) {
            if (this.chatMessage.length < 150 && auth.currentUser && this.chatMessage != '') {
                var d = new Date();
                var chat = {
                    message: this.chatMessage,
                    user: auth.currentUser.uid,
                    time: d.getTime()
                };
                this.dbref.child('topics').child(this.currentTopic).child('chat').push().set(chat);
                this.chatMessage = "";
            }
        },
        joinBlitzboard: function () {
            if (this.currentUser && this.mydata == null) {
                ref = database.ref('users/' + this.currentUser.uid + '/blitzboards/' + this.dbref.key);
                ref.set(true);
                this.$refs.welcome.style.display = 'none';
            }
        }
    },
    computed: {
        onlineMembers: function () {
            return this.members.filter(member => member.presence == true);
        },
        sortedMembers: function () {
            var sort = function (a, b) {
                if (a.presence && !b.presence)
                    return -1;
                if (!a.presence && b.presence)
                    return 1;
                if (a.displayName.toLowerCase() < b.displayName.toLowerCase())
                    return -1;
                if (a.displayName.toLowerCase() > b.displayName.toLowerCase())
                    return 1;
                return 0;
            }
            return this.members.sort(sort);
        },
        availableTopicsMethod: function () {
            var vueThis = this;
            var array = [];
            this.topics.forEach(function (topic) {
                if (vueThis.postForm.topics.includes(topic))
                    return;
                array.push(topic);
            });
            return array;
        }
    }
});

var chatBodyComponent = Vue.component("chat-body", {
    template: '#chat-body-template',
    data: () => ({
        messages: [],
        topic: '',
        parentVue: vue
    }),

    mounted() {
        this.getMessages();
    },

    methods: {
        getMessages: function () {
            var vueThis = this;
            vue.dbref.child('topics').child(vueThis.topic).child('chat').on('child_added', function (snap) {
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
            vue.dbref.child('topics').child(vueThis.topic).child('chat').limitToLast(1).on('child_added', function () {
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
            topic: '',
            parentVue: vue
        };
    },

    mounted() {
        this.getPosts();
        if (vue.currentTopic == this.topic) {
            this.$el.style.display = "block";
        }
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
        vote: null
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
            var votesRef = vue.dbref.child('users').child(auth.currentUser.uid).child('votes').child(this.dbref.key);
            votesRef.on('value', function (snap) {
                vueThis.vote = snap.val();
            });
            var urlRegex = /(https?:\/\/[^\s]+)/g;
            this.post.content = this.post.content.replace(urlRegex, function (url) {
                if (url.indexOf("https://firebasestorage.googleapis.com/") == 0 ||
                    url.indexOf("https://lh3.googleusercontent.com/") == 0 ||
                    url.indexOf("http://pbs.twimg.com/") == 0 ||
                    url.indexOf("data:image/") == 0) {
                    vueThis.post.imageURL = url;
                    vueThis.$el.classList.add('has-image');
                    return '';
                }
                return url;
            });
        },
        addPlus: function () {
            var vueThis = this;
            var votesRef = vue.dbref.child('users').child(auth.currentUser.uid).child('votes').child(this.dbref.key);
            //ref: "blitzboard_id/your_uid/votes/post_id"
            votesRef.once('value', function (snap) {
                var vote = snap.val();
                if (vote === null || vote === undefined || vote === true) { //not voted yet
                    vueThis.post.pluses++;
                    vueThis.dbref.child('pluses').set(vueThis.post.pluses);
                    votesRef.set(1);
                } else if (vote === 0) { //previously voted down
                    vueThis.post.pluses++;
                    vueThis.dbref.child('pluses').set(vueThis.post.pluses);
                    vueThis.post.minuses--;
                    vueThis.dbref.child('minuses').set(vueThis.post.minuses);
                    votesRef.set(1);
                } else if (vote === 1) { //previously voted up, user wants to undo vote
                    vueThis.post.pluses--;
                    vueThis.dbref.child('pluses').set(vueThis.post.pluses);
                    votesRef.set(null);
                }
            });
        },
        addMinus: function () {
            var vueThis = this;
            var votesRef = vue.dbref.child('users').child(auth.currentUser.uid).child('votes').child(this.dbref.key);
            //ref: "blitzboard_id/your_uid/votes/post_id"
            votesRef.once('value', function (snap) {
                var vote = snap.val();
                if (vote === null || vote === undefined || vote === true) { //not voted yet
                    vueThis.post.minuses++;
                    vueThis.dbref.child('pluses').set(vueThis.post.minuses);
                    votesRef.set(0);
                } else if (vote === 1) { //previously voted up
                    vueThis.post.minuses++;
                    vueThis.dbref.child('minuses').set(vueThis.post.minuses);
                    vueThis.post.pluses--;
                    vueThis.dbref.child('pluses').set(vueThis.post.pluses);
                    votesRef.set(0);
                } else if (vote === 0) { //previously voted down, user wants to undo vote
                    vueThis.post.minuses--;
                    vueThis.dbref.child('minuses').set(vueThis.post.minuses);
                    votesRef.set(null);
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

var topAppBar = mdc.topAppBar.MDCTopAppBar.attachTo(document.querySelector('#navbar'));
var drawer = new mdc.drawer.MDCDrawer(document.querySelector('#drawer'));
var mainContentEl = document.querySelector('#mdc-drawer-frame-content');
var listEl = document.querySelector('.mdc-drawer .mdc-list');
topAppBar.setScrollTarget(mainContentEl);
document.querySelector('.mdc-top-app-bar__navigation-icon').addEventListener('click', () => drawer.open = true);
document.body.addEventListener('MDCDrawer:closed', () => vue.$refs.newPostButton.focus());
$('.mdc-drawer-scrim').click(() => $('#drawer').addClass('mdc-drawer--closing'));

var routes = [{
    name: 'post',
    path: '/:blitzid',
    children: [{ path: ':topic' }],
    component: postWrapperComponent
}];

var router = new VueRouter({ routes });
var params = window.location.href.split('#')[1].split('/').filter(String);

var blitzboard = new Blitzboard(params[0], params[0] + '.', params[1].slice(2));
vue.dbref = blitzboard.ref;
vue.currentTopic = blitzboard.currentTopic;

vue.getAllData();
if (vue.currentTopic) {
    vue.goToTopic(vue.currentTopic);
}
vue.attachMDCStyles();

vue.loaded = true;

auth.onAuthStateChanged(function (user) {
    if (user) {
        vue.dbref.child('users').once('value').then(function (snap) {
            if (snap.val() == null)
                vue.dbref.child('users').child(user.uid).set(true);
        });
        vue.getMyRolesAndData();
        vue.currentUser = user;
        vue.initializePresenceRef(user.uid);
    } else auth.signInWithRedirect(new firebase.auth.GoogleAuthProvider());
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
    var file = vue.$refs.newPostUpload.files[0]; //the file
    var storageRef = storage.ref('blitzboard_uploads'); //where the files live
    var uploadRef = storageRef.child(file.name); //the file that we are uploading
    var uploadTask = uploadRef.put(file)
        .then(snapshot => {
            return snapshot.ref.getDownloadURL(); // Will return a promise with the download link
        })

        .then(downloadURL => {
            vue.postForm.content = downloadURL;
            return downloadURL;
        })

        .catch(error => {
            // Use to signal error if something goes wrong.
            console.log(`Failed to upload file and get link - ${error}`);
        });
}

//site.elements.newPostUpload.addEventListener('input', handleFileForNewPost);

Router.configure({
    layoutTemplate: 'layout',
    loadingTemplate: 'loading',
    waitOn: function(){
        return Meteor.subscribe('notifications'); // subscribing to two publications.
    },
    notFoundTemplate: 'notFound'
});

Router.route('/posts/:_id', {
    name: 'postPage',
    waitOn: function(){
        return [
            Meteor.subscribe('comments', this.params._id),
            Meteor.subscribe('singlePost', this.params._id)
        ];
    },
    data: function() {return Posts.findOne(this.params._id);}, // why wouldnt we use Meteor.subscribe here
});

Router.route('/posts:_id/edit', {
    name: 'postEdit',
    waitOn: function(){
        return Meteor.subscribe('singlePost', this.params._id);
    },
    data: function() {
        return Posts.findOne(this.params._id);
    }
});

Router.route('/submit', {name: 'postSubmit'});

// a route controller is simply a way to group routing features together in a nifty reusable package that any route can
// inherit from.
PostsListController = RouteController.extend({
    template: 'postsList',
    increment: 5,
    postsLimit: function(){
        return parseInt(this.params.postsLimit) || this.increment;
    },
    findOptions: function(){
        return {sort: this.sort, limit: this.postsLimit()};
    },
    subscriptions: function(){
        this.postsSub = Meteor.subscribe('posts', this.findOptions());
    },
    //waitOn: function(){
    //    return Meteor.subscribe('posts', this.findOptions());
    //},
    posts: function(){
        return Posts.find({}, this.findOptions());
    },
    data: function(){
        var hasMore = this.posts().count() === this.postsLimit();
        // so when we feed the {postsLimit: this.postsLimit() + this.increment} to this.route.path(), were telling
        // the postsList route to build its own path using that javascript object as data context
        //var nextPath = this.route.path({postsLimit: this.postsLimit() + this.increment});
        return {
            posts: this.posts(),
            ready: this.postsSub.ready,
            nextPath: hasMore ? this.nextPath() : null
        };
        return {posts: Posts.find({}, this.findOptions())};
    }
});

NewPostsController = PostsListController.extend({
    sort: {submitted: -1, id: -1},
    nextPath: function(){
        return Router.routes.newPosts.path({postsLimit: this.postsLimit() + this.increment})
    }
});

BestPostsController = PostsListController.extend({
    sort: {votes: -1, submitted: -1, _id: -1},
    nextPath: function(){
        return Router.routes.bestPosts.path({postsLimit: this.postsLimit() + this.increment})
    }
});

Router.route('/', {
    name: 'home',
    controller: NewPostsController
});

// adding a ? after the parameter name means that its optional.
// so our route will not only match to http://localhost:3000/50 , but also plain http://localhost:3000
Router.route('/new/:postsLimit?', {
    name: 'newPosts'
    //waitOn: function(){
    //    // we need to deal with the case where the postsLimit parameter isn't present, so we'll assign it a default
    //    // value
    //    var limit = parseInt(this.params.postsLimit) || 5;
    //    // you will notice that we are now passing a javascript object {sort: {submitted: -1}, limit: limit}
    //    // along with the name of our posts publication.
    //    // the object will serve as the options parameter for the server side Posts.find()
    //    return Meteor.subscribe('posts', {sort: {submitted: -1}, limit: limit});
    //},

    // now that were subscribing at the route level, it would also make sense to set the data context in the same
    // place.
    // well deviate from our previous pattern and make the data function return a javascript object instead of simply'
    // returning a cursor.
    // this lets us create a named data context, which we will call posts.

    // what this means is simply that instead of being implicitly available as this inside the template,
    // our data context will be available as posts.

    // setting the data context at the route level, we can now safely get rid of the posts template helper
    // inside the posts_list.js
    //data: function(){
    //    var limit = parseInt(this.params.postsLimit) || 5;
    //    return {
    //        posts: Posts.find({}, {sort: {submitted: -1}, limit: limit})
    //    };
    //}
});

Router.route('/best/:postLimit?', {
    name: 'bestPosts'
})
var requireLogin = function() {
    if (! Meteor.user()) {
        if (Meteor.loggingIn()) {
            this.render(this.loadingTemplate);
        } else {
            this.render('accessDenied');
        }
    } else {
        this.next();
    }
}


Router.onBeforeAction('dataNotFound', {only: 'postPage'});
Router.onBeforeAction(requireLogin, {only: 'postSubmit'});
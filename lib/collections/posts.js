Posts = new Mongo.Collection('posts');

//Posts.allow({
//    insert: function(userId, doc){
//        // only allow posting if you are logged in
//
//        return !! userId;
//    }
//})

Meteor.methods({
    postInsert: function(postAttributes) {
        check(Meteor.userId(), String);
        check(postAttributes, {
            title: String,
            url: String
        });

        var errors = validatePost(postAttributes);
        if (errors.title || errors.url)
            throw new Meteor.Error('invalid-post', "You must set a title and URL for your post");

        var postWithSameLink = Posts.findOne({url: postAttributes.url});
        if (postWithSameLink) {
            return {
                postExists: true,
                _id: postWithSameLink._id
            }
        }

        var user = Meteor.user();
        var post = _.extend(postAttributes, {
            userId: user._id,
            author: user.username,
            submitted: new Date(),
            commentsCount: 0
        });
        var postId = Posts.insert(post);
        return {
            _id: postId
        };
    },
    upvote: function(postId){
        check(this.userId, String);
        check(postId, String);

        //var post = Posts.findOne(postId);
        //if (!post){
        //    throw new Meteor.Error('invalid', 'Post not found');
        //}
        //if (_.include(post.upvoters, this.userId)){
        //    throw new Meteor.Error('invalid', 'Already upvoted this post');
        //}
        //
        //Posts.update(post._id, {
        //    // $addToSet ass an item to an array property as long as it doesnt exist
        //    $addToSet: {upvoters: this.userId},
        //    // $inc simply increments an integer field
        //    $inc: {votes: 1}
        //});

        var affected = Posts.update({
            _id: postId,
            upvoters: {$ne: this.userId}
        }, {
            $addToSet: {upvoters: this.userId},
            $inc: {votes: 1}
        });

        if (! affected){
            throw new Meteor.Error('invalid', "You weren't able to upvote that post");
        }
    }
});

Posts.allow({
    update : function(userId, post) {
        return ownsDocument(userId, post);
    },
    remove: function(userId, post) {
        return ownsDocument(userId, post);
    }
});

Posts.deny({
    update: function(userId,post, fieldNames){
        // may only edit the following two fields:
        return (_.without(fieldNames, 'url', 'title').length > 0);
    },
    update: function(userId, post, fieldNames, modifier) {
        var errors = validatePost(modifier.$set);
        return errors.title || errors.url;
    }
});

validatePost = function(post) {
    var errors = {};
    if (!post.title) {
        errors.title = "Please fill in a Title";
    }
    if (!post.url) {
        errors.url = "Please fill in a URL";
    }
    return errors;
}
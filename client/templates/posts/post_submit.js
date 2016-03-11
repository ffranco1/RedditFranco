Template.postSubmit.events({
   'submit form': function(e){
       e.preventDefault();

       var post = {
           title: $(e.target).find('[name=title]').val(),
           url: $(e.target).find('[name=url]').val()
       };

       var errors = validatePost(post);
       if (errors.title || errors.url) {
           return Session.set('postSubmitErrors', errors);
       }

       Meteor.call('postInsert', post, function(error, result) {
           // display the error to the user and abort
           if (error) {
               return throwError(error.reason);
           }
           // result.postExists was set to true in the Meteor Method
           if (result.postExists) {
               throwError('This link has already been posted');
           }
           Router.go('postPage', {_id: result._id});
       })
   }
});

Template.postSubmit.onCreated(function() {
    Session.set('postSubmitErrors', {});
});
Template.postSubmit.helpers({
    errorMessage: function(field) {
        return Session.get('postSubmitErrors')[field];
    },
    errorClass: function (field) {
        return !!Session.get('postSubmitErrors')[field] ? 'has-error' : '';
    }
});
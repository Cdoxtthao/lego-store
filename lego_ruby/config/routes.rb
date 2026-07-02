Rails.application.routes.draw do
  namespace :api do
    namespace :v1 do
      # Chat routes
      get  'messages/my',              to: 'messages#my_messages'
      get  'messages/conversations',   to: 'messages#conversations'
      get  'messages/user/:user_id',   to: 'messages#user_messages'
      post 'messages',                 to: 'messages#create'
      post 'messages/reply',           to: 'messages#reply'
    end
  end
end
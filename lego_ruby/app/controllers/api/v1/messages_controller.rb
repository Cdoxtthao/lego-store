module Api
  module V1
    class MessagesController < ApplicationController

      # GET /api/v1/messages/my
      # User lấy lịch sử chat của mình
      def my_messages
        user_id = get_user_id
        return render_unauthorized unless user_id

        messages = Message
          .where(UserId: user_id)
          .order(:CreatedAt)
          .map { |m| format_message(m) }

        render json: messages
      end

      # GET /api/v1/messages/conversations
      # Admin xem danh sách conversations
      def conversations
        # Group theo UserId
        raw = Message
          .select('UserId, MAX(CreatedAt) as LastTime,
            MAX(Content) as LastMessage,
            SUM(CASE WHEN IsFromUser = 1
              AND IsRead = 0 THEN 1 ELSE 0 END) as UnreadCount')
          .group(:UserId)
          .order('LastTime DESC')

        # Lấy thêm thông tin user
        result = raw.map do |row|
          user = ActiveRecord::Base.connection.execute(
            "SELECT FullName, Email, AvatarUrl
             FROM Users WHERE Id = #{row[:UserId]}"
          ).first

          {
            userId: row[:UserId],
            userName: user&.[]('FullName'),
            userEmail: user&.[]('Email'),
            avatarUrl: user&.[]('AvatarUrl'),
            lastMessage: row[:LastMessage],
            lastTime: row[:LastTime],
            unreadCount: row[:UnreadCount],
          }
        end

        render json: result
      end

      # GET /api/v1/messages/user/:user_id
      # Admin xem chi tiết chat với 1 user
      def user_messages
        user_id = params[:user_id]

        # Đánh dấu đã đọc
        Message
          .where(UserId: user_id, IsFromUser: true, IsRead: false)
          .update_all(IsRead: true)

        messages = Message
          .where(UserId: user_id)
          .order(:CreatedAt)
          .map { |m| format_message(m) }

        render json: messages
      end

      # POST /api/v1/messages
      # User gửi tin nhắn
      def create
        user_id = get_user_id
        return render_unauthorized unless user_id

        message = Message.new
        message[:UserId] = user_id
        message[:Content] = params[:content]
        message[:IsFromUser] = true
        message[:IsRead] = false
        message[:CreatedAt] = Time.current

        if message.save
          render json: {
            message: 'Gửi tin nhắn thành công',
            data: format_message(message)
          }, status: :created
        else
          render json: {
            message: 'Có lỗi xảy ra'
          }, status: :unprocessable_entity
        end
      end

      # POST /api/v1/messages/reply
      # Admin reply tin nhắn
      def reply
        target_user_id = params[:target_user_id]
        content = params[:content]

        message = Message.new
        message[:UserId] = target_user_id
        message[:Content] = content
        message[:IsFromUser] = false
        message[:IsRead] = false
        message[:CreatedAt] = Time.current

        if message.save
          render json: {
            message: 'Gửi reply thành công',
            data: format_message(message)
          }, status: :created
        else
          render json: { message: 'Có lỗi xảy ra' },
            status: :unprocessable_entity
        end
      end

      private

      # Lấy userId từ JWT token
      def get_user_id
        auth_header = request.headers['Authorization']
        return nil unless auth_header

        token = auth_header.split(' ').last
        # Decode JWT
        decoded = decode_jwt(token)
        decoded&.[]('nameid')
      end

      def decode_jwt(token)
        require 'base64'
        require 'json'

        # JWT có 3 phần: header.payload.signature
        parts = token.split('.')
        return nil unless parts.length == 3

        # Decode phần payload (phần 2)
        payload = parts[1]
        # Thêm padding nếu cần
        payload += '=' * (4 - payload.length % 4) % 4
        JSON.parse(Base64.decode64(payload))
      rescue
        nil
      end

      def render_unauthorized
        render json: { message: 'Unauthorized' },
          status: :unauthorized
      end

      def format_message(m)
        {
          id: m.id,
          content: m[:Content],
          isFromUser: m[:IsFromUser],
          isRead: m[:IsRead],
          createdAt: m[:CreatedAt],
        }
      end
    end
  end
end
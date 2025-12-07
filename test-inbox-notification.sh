#!/bin/bash

# Your Expo Push Token
TOKEN="ExponentPushToken[YrG4TqIMvqXyXclIZFGurO]"

echo "🔔 Sending Inbox notification..."

curl -H "Content-Type: application/json" \
     -X POST https://exp.host/--/api/v2/push/send \
     -d "{
  \"to\": \"$TOKEN\",
  \"title\": \"New Message\",
  \"body\": \"You have a new secure message in your Inbox.\",
  \"sound\": \"default\",
  \"categoryId\": \"DEFAULT\",
  \"data\": {
    \"screen\": \"inbox\",
    \"messageId\": \"12345\"
  }
}"

echo ""
echo "✅ Sent! Tap the notification to open the Inbox."

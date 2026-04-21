#!/bin/bash

echo "🚀 Lost & Found Portal Setup"
echo "=============================="
echo ""

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
  echo "📦 Installing dependencies..."
  npm install
  echo ""
fi

# Check MySQL connection
echo "🔍 Checking MySQL connection..."
echo "Please enter your MySQL root password (press Enter if no password):"
read -s MYSQL_PASSWORD

if [ -z "$MYSQL_PASSWORD" ]; then
  MYSQL_CMD="mysql -u root"
else
  MYSQL_CMD="mysql -u root -p$MYSQL_PASSWORD"
fi

# Test connection
$MYSQL_CMD -e "SELECT 1;" > /dev/null 2>&1
if [ $? -eq 0 ]; then
  echo "✅ MySQL connection successful!"
  
  # Update .env file
  sed -i '' "s/DB_PASSWORD=.*/DB_PASSWORD=$MYSQL_PASSWORD/" .env
  
  # Create database and tables
  echo "📊 Creating database and tables..."
  $MYSQL_CMD < schema.sql
  
  if [ $? -eq 0 ]; then
    echo "✅ Database setup complete!"
    echo ""
    echo "🎉 Setup complete! Starting server..."
    echo ""
    npm start
  else
    echo "❌ Failed to create database. Please check schema.sql"
  fi
else
  echo "❌ MySQL connection failed. Please check your password and try again."
  echo ""
  echo "Manual setup:"
  echo "1. Update .env file with your MySQL password"
  echo "2. Run: mysql -u root -p < schema.sql"
  echo "3. Run: npm start"
fi

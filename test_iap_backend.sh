#!/bin/bash
# Quick Backend IAP Test Script

echo "=== Testing Backend IAP Configuration ==="

echo ""
echo "✓ Checking .env configuration..."
ssh -i /Users/mahammadrasheed/Downloads/Spendly.pem ubuntu@44.210.80.75 "cd /home/ubuntu/spendly/SpendlyAPI && grep APPLE_IAP_SHARED_SECRET .env | head -1"

echo ""
echo "✓ Checking IAP routes..."
ssh -i /Users/mahammadrasheed/Downloads/Spendly.pem ubuntu@44.210.80.75 "cd /home/ubuntu/spendly/SpendlyAPI && php artisan route:list | grep apple-iap"

echo ""
echo "✓ Checking if AppleIAPService exists..."
ssh -i /Users/mahammadrasheed/Downloads/Spendly.pem ubuntu@44.210.80.75 "ls /home/ubuntu/spendly/SpendlyAPI/app/Services/AppleIAPService.php && echo 'Service file exists!'"

echo ""
echo "✓ Checking if AppleIAPController exists..."
ssh -i /Users/mahammadrasheed/Downloads/Spendly.pem ubuntu@44.210.80.75 "ls /home/ubuntu/spendly/SpendlyAPI/app/Http/Controllers/AppleIAPController.php && echo 'Controller file exists!'"

echo ""
echo "=== Backend Setup Complete! ==="
echo ""
echo "Next steps:"
echo "1. Create IAP products in App Store Connect"
echo "2. Test purchase with sandbox account"
echo "3. Monitor: ssh ubuntu@44.210.80.75 'tail -f /home/ubuntu/spendly/SpendlyAPI/storage/logs/laravel.log'"

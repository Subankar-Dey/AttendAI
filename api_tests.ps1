$baseUrl = "http://localhost:5000"

# TEST 1
Write-Host "TEST 1: Health Check" -ForegroundColor Cyan
try {
    $r = Invoke-WebRequest -Uri "$baseUrl/api/health" -Method GET -UseBasicParsing
    Write-Host "✅ Status: $($r.StatusCode)"
    $r.Content
} catch {
    Write-Host "❌ Error: $($_.Exception.Response.StatusCode)"
}

# TEST 2
Write-Host "`nTEST 2: Register User" -ForegroundColor Cyan
try {
    $body = @{name="John Student";email="john@test.com";password="Pass123!";role="student"} | ConvertTo-Json
    $r = Invoke-WebRequest -Uri "$baseUrl/api/auth/register" -Method POST -ContentType "application/json" -Body $body -UseBasicParsing
    Write-Host "✅ Status: $($r.StatusCode)"
    $token = ($r.Content | ConvertFrom-Json).token
    $global:regToken = $token
    Write-Host "Token obtained: $($token.Substring(0,20))..."
} catch {
    Write-Host "❌ Error: $($_.Exception.Response.StatusCode)"
}

# TEST 3
Write-Host "`nTEST 3: Admin Login" -ForegroundColor Cyan
try {
    $body = @{email="admin@attendai.com";password="admin123"} | ConvertTo-Json
    $r = Invoke-WebRequest -Uri "$baseUrl/api/auth/login" -Method POST -ContentType "application/json" -Body $body -UseBasicParsing
    Write-Host "✅ Status: $($r.StatusCode)"
    $resp = $r.Content | ConvertFrom-Json
    $global:adminToken = $resp.token
    Write-Host "Token: $($resp.token.Substring(0,20))..., Role: $($resp.role)"
} catch {
    Write-Host "❌ Error: $($_.Exception.Response.StatusCode)"
}

# TEST 4
Write-Host "`nTEST 4: Dashboard Stats" -ForegroundColor Cyan
try {
    $h = @{"Authorization"="Bearer $global:adminToken"}
    $r = Invoke-WebRequest -Uri "$baseUrl/api/dashboard/stats" -Method GET -Headers $h -UseBasicParsing
    Write-Host "✅ Status: $($r.StatusCode)"
    $body = $r.Content | ConvertFrom-Json
    Write-Host "Stats: totalStudents=$($body.totalStudents), totalStaff=$($body.totalStaff)"
} catch {
    Write-Host "❌ Error: $($_.Exception.Response.StatusCode)"
}

# TEST 5
Write-Host "`nTEST 5: List Users" -ForegroundColor Cyan
try {
    $h = @{"Authorization"="Bearer $global:adminToken"}
    $r = Invoke-WebRequest -Uri "$baseUrl/api/users?page=1&limit=10" -Method GET -Headers $h -UseBasicParsing
    Write-Host "✅ Status: $($r.StatusCode)"
    $body = $r.Content | ConvertFrom-Json
    Write-Host "Users: Count=$($body.users.Count), Total=$($body.total)"
} catch {
    Write-Host "❌ Error: $($_.Exception.Response.StatusCode)"
}

# TEST 6
Write-Host "`nTEST 6: AI Chatbot" -ForegroundColor Cyan
try {
    $body = @{message="What is my attendance percentage?"} | ConvertTo-Json
    $h = @{"Authorization"="Bearer $global:adminToken"}
    $r = Invoke-WebRequest -Uri "$baseUrl/api/ai/chat" -Method POST -ContentType "application/json" -Body $body -Headers $h -UseBasicParsing
    Write-Host "✅ Status: $($r.StatusCode)"
    $resp = $r.Content | ConvertFrom-Json
    Write-Host "Response: $($resp.data.response.Substring(0,80))..."
} catch {
    Write-Host "❌ Error: $($_.Exception.Response.StatusCode)"
}

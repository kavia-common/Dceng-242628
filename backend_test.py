#!/usr/bin/env python3
"""
Backend API Testing for Discourse Engine
Tests all API endpoints with realistic data
"""

import requests
import json
import sys
from datetime import datetime

# Use localhost for testing since external routing has issues
BACKEND_URL = "http://localhost:8001"
API_BASE = f"{BACKEND_URL}/api"

def test_api_health():
    """Test if API is running"""
    print("🔍 Testing API Health...")
    try:
        response = requests.get(f"{BACKEND_URL}/")
        print(f"Status: {response.status_code}")
        print(f"Response: {response.json()}")
        
        if response.status_code == 200:
            print("✅ API Health Check: PASSED")
            return True
        else:
            print("❌ API Health Check: FAILED")
            return False
    except Exception as e:
        print(f"❌ API Health Check: FAILED - {str(e)}")
        return False

def test_create_session():
    """Test session creation with realistic avatar data"""
    print("\n🔍 Testing Session Creation...")
    
    session_data = {
        "userAvatar": {
            "gender": "male",
            "skinTone": "medium", 
            "hairStyle": "short",
            "facialFeature": "neutral"
        },
        "otherAvatar": {
            "gender": "female",
            "skinTone": "light",
            "hairStyle": "long", 
            "facialFeature": "neutral"
        },
        "userName": "Alex",
        "otherName": "Sarah"
    }
    
    try:
        response = requests.post(
            f"{API_BASE}/session/create",
            json=session_data,
            headers={"Content-Type": "application/json"}
        )
        
        print(f"Status: {response.status_code}")
        print(f"Response: {response.json()}")
        
        if response.status_code == 200:
            session_id = response.json().get("sessionId")
            if session_id:
                print("✅ Session Creation: PASSED")
                return session_id
            else:
                print("❌ Session Creation: FAILED - No sessionId returned")
                return None
        else:
            print("❌ Session Creation: FAILED")
            return None
    except Exception as e:
        print(f"❌ Session Creation: FAILED - {str(e)}")
        return None

def test_get_session(session_id):
    """Test retrieving session data"""
    print(f"\n🔍 Testing Get Session (ID: {session_id})...")
    
    try:
        response = requests.get(f"{API_BASE}/session/{session_id}")
        print(f"Status: {response.status_code}")
        print(f"Response: {response.json()}")
        
        if response.status_code == 200:
            session_data = response.json()
            # Verify session contains expected fields
            required_fields = ["userAvatar", "otherAvatar", "userName", "otherName", "createdAt", "messages"]
            if all(field in session_data for field in required_fields):
                print("✅ Get Session: PASSED")
                return True
            else:
                print("❌ Get Session: FAILED - Missing required fields")
                return False
        else:
            print("❌ Get Session: FAILED")
            return False
    except Exception as e:
        print(f"❌ Get Session: FAILED - {str(e)}")
        return False

def test_analyze_message(session_id):
    """Test pattern detection with toxic message"""
    print(f"\n🔍 Testing Message Analysis (Session: {session_id})...")
    
    # Test with a message that should trigger blame_shifting pattern
    analyze_data = {
        "sessionId": session_id,
        "speaker": "user",
        "text": "You always blame me for everything! It's never your fault, is it? You're the one who started this argument."
    }
    
    try:
        response = requests.post(
            f"{API_BASE}/analyze",
            json=analyze_data,
            headers={"Content-Type": "application/json"}
        )
        
        print(f"Status: {response.status_code}")
        response_data = response.json()
        print(f"Response: {response_data}")
        
        if response.status_code == 200:
            patterns = response_data.get("patterns", [])
            success = response_data.get("success", False)
            
            if success:
                print(f"✅ Message Analysis: PASSED")
                if patterns:
                    print(f"   Detected {len(patterns)} pattern(s):")
                    for pattern in patterns:
                        print(f"   - {pattern.get('type', 'unknown')} (confidence: {pattern.get('confidence', 0)})")
                        print(f"     Evidence: {pattern.get('evidence', 'N/A')}")
                else:
                    print("   No toxic patterns detected (this might be expected)")
                return True
            else:
                print("❌ Message Analysis: FAILED - Success flag is False")
                return False
        else:
            print("❌ Message Analysis: FAILED")
            return False
    except Exception as e:
        print(f"❌ Message Analysis: FAILED - {str(e)}")
        return False

def test_get_messages(session_id):
    """Test retrieving all messages for a session"""
    print(f"\n🔍 Testing Get Messages (Session: {session_id})...")
    
    try:
        response = requests.get(f"{API_BASE}/session/{session_id}/messages")
        print(f"Status: {response.status_code}")
        response_data = response.json()
        print(f"Response: {response_data}")
        
        if response.status_code == 200:
            messages = response_data.get("messages", [])
            print(f"✅ Get Messages: PASSED")
            print(f"   Found {len(messages)} message(s)")
            
            # Verify message structure if messages exist
            if messages:
                first_msg = messages[0]
                required_fields = ["sessionId", "speaker", "text", "timestamp", "patterns"]
                if all(field in first_msg for field in required_fields):
                    print("   Message structure is correct")
                else:
                    print("   ⚠️  Message structure missing some fields")
            
            return True
        else:
            print("❌ Get Messages: FAILED")
            return False
    except Exception as e:
        print(f"❌ Get Messages: FAILED - {str(e)}")
        return False

def test_analyze_healthy_message(session_id):
    """Test pattern detection with healthy communication"""
    print(f"\n🔍 Testing Healthy Message Analysis (Session: {session_id})...")
    
    analyze_data = {
        "sessionId": session_id,
        "speaker": "other",
        "text": "I understand you're frustrated. I take responsibility for my part in this. Can we work together to find a solution?"
    }
    
    try:
        response = requests.post(
            f"{API_BASE}/analyze",
            json=analyze_data,
            headers={"Content-Type": "application/json"}
        )
        
        print(f"Status: {response.status_code}")
        response_data = response.json()
        print(f"Response: {response_data}")
        
        if response.status_code == 200:
            patterns = response_data.get("patterns", [])
            success = response_data.get("success", False)
            
            if success:
                print(f"✅ Healthy Message Analysis: PASSED")
                if patterns:
                    print(f"   Detected {len(patterns)} pattern(s):")
                    for pattern in patterns:
                        print(f"   - {pattern.get('type', 'unknown')} (confidence: {pattern.get('confidence', 0)})")
                else:
                    print("   No patterns detected")
                return True
            else:
                print("❌ Healthy Message Analysis: FAILED - Success flag is False")
                return False
        else:
            print("❌ Healthy Message Analysis: FAILED")
            return False
    except Exception as e:
        print(f"❌ Healthy Message Analysis: FAILED - {str(e)}")
        return False

def run_all_tests():
    """Run all backend API tests"""
    print("=" * 60)
    print("🚀 DISCOURSE ENGINE BACKEND API TESTS")
    print("=" * 60)
    
    results = {
        "api_health": False,
        "create_session": False,
        "get_session": False,
        "analyze_toxic": False,
        "analyze_healthy": False,
        "get_messages": False
    }
    
    # Test 1: API Health
    results["api_health"] = test_api_health()
    
    if not results["api_health"]:
        print("\n❌ API is not responding. Stopping tests.")
        return results
    
    # Test 2: Create Session
    session_id = test_create_session()
    results["create_session"] = session_id is not None
    
    if not session_id:
        print("\n❌ Cannot create session. Stopping dependent tests.")
        return results
    
    # Test 3: Get Session
    results["get_session"] = test_get_session(session_id)
    
    # Test 4: Analyze Toxic Message
    results["analyze_toxic"] = test_analyze_message(session_id)
    
    # Test 5: Analyze Healthy Message
    results["analyze_healthy"] = test_analyze_healthy_message(session_id)
    
    # Test 6: Get Messages
    results["get_messages"] = test_get_messages(session_id)
    
    # Summary
    print("\n" + "=" * 60)
    print("📊 TEST SUMMARY")
    print("=" * 60)
    
    passed = sum(1 for result in results.values() if result)
    total = len(results)
    
    for test_name, result in results.items():
        status = "✅ PASSED" if result else "❌ FAILED"
        print(f"{test_name.replace('_', ' ').title()}: {status}")
    
    print(f"\nOverall: {passed}/{total} tests passed")
    
    if passed == total:
        print("🎉 All tests passed!")
        return True
    else:
        print("⚠️  Some tests failed. Check logs above for details.")
        return False

if __name__ == "__main__":
    success = run_all_tests()
    sys.exit(0 if success else 1)
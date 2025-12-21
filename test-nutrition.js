// Test script for nutrition API
const testNutritionAPI = async () => {
  try {
    console.log('Testing nutrition API...');

    // Test GET request
    const getResponse = await fetch('/api/nutrition');
    console.log('GET /api/nutrition:', getResponse.status);

    // Test POST request with sample data
    const postResponse = await fetch('/api/nutrition', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        calories: 2000,
        protein: 150,
        carbs: 250,
        fats: 67
      })
    });

    console.log('POST /api/nutrition:', postResponse.status);

    if (postResponse.ok) {
      const result = await postResponse.json();
      console.log('Response:', result);
    } else {
      console.log('Error:', await postResponse.text());
    }

  } catch (error) {
    console.error('Test failed:', error);
  }
};

// Only run in browser console
if (typeof window !== 'undefined') {
  testNutritionAPI();
}
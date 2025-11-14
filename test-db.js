const { MongoClient } = require('mongodb');

async function checkData() {
  const uri = 'mongodb://localhost:27017';
  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    const db = client.db('lca-visual-studios');
    
    // Check categories
    const categories = await db.collection('publicCategories').find().toArray();
    console.log('\n📁 Categories:', categories.length);
    categories.forEach(c => console.log(`  - ${c.name} (ID: ${c._id})`));
    
    // Check media
    const media = await db.collection('publicMedia').find().toArray();
    console.log('\n🖼️  Media items:', media.length);
    media.forEach(m => console.log(`  - ${m.name} (Category: ${m.categoryId})`));
    
    if (media.length === 0) {
      console.log('\n⚠️  No media found in database!');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.close();
  }
}

checkData();
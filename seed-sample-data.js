// seed-sample-data.js
const { MongoClient } = require('mongodb');
const path = require('path');
const fs = require('fs');

const MONGODB_URI = 'mongodb://localhost:27017';
const DB_NAME = 'lca-visual-studios';

// Sample image URLs (placeholder images)
const sampleImages = [
  'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=800',
  'https://images.unsplash.com/photo-1519741497674-611481863552?w=800',
  'https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?w=800',
  'https://images.unsplash.com/photo-1460978812857-470ed1c77af0?w=800',
  'https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=800',
  'https://images.unsplash.com/photo-1583939003579-730e3918a45a?w=800',
];

async function seedData() {
  console.log('🌱 Starting database seed...');
  
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const db = client.db(DB_NAME);
    
    // 1. Seed public_gallery_categories
    console.log('\n📁 Creating gallery categories...');
    const categoriesCollection = db.collection('public_gallery_categories');
    await categoriesCollection.deleteMany({}); // Clear existing
    
    const categories = [
      { _id: 'weddings', name: 'Weddings', slug: 'weddings', order: 0, createdAt: new Date() },
      { _id: 'portraits', name: 'Portraits', slug: 'portraits', order: 1, createdAt: new Date() },
      { _id: 'events', name: 'Events', slug: 'events', order: 2, createdAt: new Date() },
    ];
    
    await categoriesCollection.insertMany(categories);
    console.log(`✅ Created ${categories.length} categories`);
    
    // 2. Seed public_gallery_media
    console.log('\n🖼️  Creating media items...');
    const mediaCollection = db.collection('public_gallery_media');
    await mediaCollection.deleteMany({}); // Clear existing
    
    const mediaItems = [];
    categories.forEach((cat, catIdx) => {
      sampleImages.forEach((url, imgIdx) => {
        mediaItems.push({
          categoryId: cat._id,
          name: `${cat.name} Photo ${imgIdx + 1}`,
          url: url,
          previewUrl: url,
          localPath: url, // Using external URL for demo
          mimeType: 'image/jpeg',
          type: 'photo',
          order: imgIdx,
          importedAt: new Date(),
        });
      });
    });
    
    await mediaCollection.insertMany(mediaItems);
    console.log(`✅ Created ${mediaItems.length} media items`);
    
    // 3. Seed home_gallery
    console.log('\n🏠 Creating home gallery...');
    const homeGalleryCollection = db.collection('home_gallery');
    await homeGalleryCollection.deleteMany({}); // Clear existing
    
    const homeItems = sampleImages.slice(0, 4).map((url, idx) => ({
      section: 'hero',
      name: `Hero Image ${idx + 1}`,
      url: url,
      previewUrl: url,
      localPath: url,
      mimeType: 'image/jpeg',
      type: 'photo',
      order: idx,
      publish: true,
      importedAt: new Date(),
    }));
    
    await homeGalleryCollection.insertMany(homeItems);
    console.log(`✅ Created ${homeItems.length} home gallery items`);
    
    // 4. Create sample customer project
    console.log('\n👤 Creating sample customer project...');
    const projectsCollection = db.collection('customer_projects');
    await projectsCollection.deleteMany({ referenceId: 'DEMO-001' });
    
    const sampleProject = {
      referenceId: 'DEMO-001',
      category: 'Wedding',
      selectionLocked: false,
      rawFolders: [
        { name: 'Raw Photos', counts: { raw: 6, selected: 0 } }
      ],
      editedText: '',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    await projectsCollection.insertOne(sampleProject);
    console.log('✅ Created sample project: DEMO-001');
    
    // 5. Seed customer_assets
    console.log('\n📸 Creating customer assets...');
    const assetsCollection = db.collection('customer_assets');
    await assetsCollection.deleteMany({ referenceId: 'DEMO-001' });
    
    const customerAssets = sampleImages.map((url, idx) => ({
      referenceId: 'DEMO-001',
      folderName: 'Raw Photos',
      sourceFolderName: 'Raw Photos',
      name: `Photo_${idx + 1}.jpg`,
      url: url,
      previewUrl: url,
      localPath: url,
      mimeType: 'image/jpeg',
      size: 2457139,
      source: 'demo',
      isSelected: false,
      importedAt: new Date(),
      updatedAt: new Date(),
    }));
    
    await assetsCollection.insertMany(customerAssets);
    console.log(`✅ Created ${customerAssets.length} customer assets`);
    
    // 6. Create sample contact
    console.log('\n📧 Creating sample contact...');
    const contactsCollection = db.collection('contacts');
    await contactsCollection.deleteMany({ referenceId: 'DEMO-001' });
    
    const sampleContact = {
      referenceId: 'DEMO-001',
      name: 'Demo Customer',
      email: 'demo@example.com',
      phone: '555-0123',
      eventType: 'Wedding',
      city: 'Demo City',
      state: 'Demo State',
      country: 'Demo Country',
      createdAt: new Date(),
    };
    
    await contactsCollection.insertOne(sampleContact);
    console.log('✅ Created sample contact');
    
    console.log('\n' + '='.repeat(50));
    console.log('🎉 Database seeding completed successfully!');
    console.log('='.repeat(50));
    console.log('\n📊 Summary:');
    console.log(`   Categories: ${categories.length}`);
    console.log(`   Public Media: ${mediaItems.length}`);
    console.log(`   Home Gallery: ${homeItems.length}`);
    console.log(`   Customer Projects: 1 (DEMO-001)`);
    console.log(`   Customer Assets: ${customerAssets.length}`);
    console.log(`   Contacts: 1`);
    console.log('\n🌐 You can now visit:');
    console.log('   - http://localhost:3000 (Home page)');
    console.log('   - http://localhost:3000/my-work (Public gallery)');
    console.log('   - http://localhost:3000/customer-dashboard (Use ref: DEMO-001)');
    console.log('   - http://localhost:3000/admin/customer-gallery');
    console.log('   - http://localhost:3000/admin/public-gallery');
    console.log('   - http://localhost:3000/admin/home-gallery');
    console.log('');
    
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  } finally {
    await client.close();
    console.log('✅ Database connection closed');
  }
}

seedData();

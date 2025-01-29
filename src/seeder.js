import mongoose from 'mongoose';
import faker from 'faker';
import { dbConnect } from './config/dbConfig.js';

// Import models
import { userModel } from './models/user.model.js';
import { categoryModel } from './models/category.model.js';
import { courseModel } from './models/course.model.js';
import { videoModel } from './models/video.model.js';
import { ratingModel } from './models/rating.model.js';
import { commentModel } from './models/comment.model.js';
import { txnModel } from './models/transaction.model.js';
import { userCourseEnrollModel } from './models/userCourseEnroll.model.js';

async function seedUsers() {
  const users = [];
  for (let i = 0; i < 20; i++) {
    users.push({
      fullname: faker.name.findName(),
      username: faker.internet.userName(),
      email: faker.internet.email(),
      userType: faker.random.arrayElement(['student', 'teacher']),
      password: faker.internet.password(),
      profilePic: faker.image.avatar(),
      number: faker.phone.phoneNumber(),
      address: faker.address.streetAddress(),
      municipality: faker.address.city(),
      district: faker.address.cityName(),
      state: faker.address.state(),
      country: faker.address.country()
    });
  }
  return userModel.insertMany(users);
}

async function seedCategories() {
  const categories = [];
  for (let i = 0; i < 5; i++) {
    categories.push({
      name: faker.commerce.department()
    });
  }
  return categoryModel.insertMany(categories);
}

async function seedCourses(users, categories) {
  const courses = [];
  for (let i = 0; i < 10; i++) {
    courses.push({
      title: faker.commerce.productName(),
      subTitle: faker.commerce.productDescription(),
      description: faker.lorem.paragraph(),
      thumbnail: faker.image.imageUrl(),
      level: faker.random.arrayElement([
        'Beginner',
        'Intermediate',
        'Advanced'
      ]),
      category: faker.random.arrayElement(categories)._id,
      creator: faker.random.arrayElement(
        users.filter((u) => u.userType === 'teacher')
      )._id,
      price: faker.commerce.price(),
      visible: faker.datatype.boolean()
    });
  }
  return courseModel.insertMany(courses);
}

async function seedVideos(courses, users) {
  const videos = [];
  for (let i = 0; i < 50; i++) {
    videos.push({
      title: faker.lorem.sentence(),
      uuid: faker.datatype.uuid(),
      description: faker.lorem.paragraph(),
      manifestFile:
        'http://localhost:8000/uploads/videos/89988a12-7ede-45d1-8c90-4b124eb2f9c1/master.m3u8',
      course: faker.random.arrayElement(courses)._id,
      uploader: faker.random.arrayElement(
        users.filter((u) => u.userType === 'teacher')
      )._id,
      thumbnail: faker.image.imageUrl(),
      likes: faker.datatype.number({ min: 0, max: 100 })
    });
  }
  return videoModel.insertMany(videos);
}

async function seedRatings(users, courses) {
  const ratings = [];
  for (let i = 0; i < 30; i++) {
    ratings.push({
      rated_by: faker.random.arrayElement(users)._id,
      course: faker.random.arrayElement(courses)._id,
      rating: faker.datatype.number({ min: 1, max: 5 })
    });
  }
  return ratingModel.insertMany(ratings);
}

async function seedComments(users, videos) {
  const comments = [];
  for (let i = 0; i < 40; i++) {
    comments.push({
      comment_on: faker.random.arrayElement(['video']),
      comment_on_ref: faker.random.arrayElement(videos)._id,
      commentor: faker.random.arrayElement(users)._id,
      content: faker.lorem.sentences(),
      parent_comment_ref: null,
      deleted: faker.datatype.boolean(),
      edited: faker.datatype.boolean(),
      likes: faker.datatype.number({ min: 0, max: 50 })
    });
  }
  return commentModel.insertMany(comments);
}

async function seedTransactions(users) {
  const transactions = [];
  for (let i = 0; i < 20; i++) {
    transactions.push({
      transactionCode: faker.datatype.uuid(),
      status: 'COMPLETE',
      totalAmount: faker.commerce.price(),
      transactionUuid: faker.datatype.uuid(),
      productCode: faker.datatype.uuid(),
      signature: faker.datatype.uuid(),
      fee: faker.datatype.number({ min: 0, max: 50 }),
      user: faker.random.arrayElement(users)._id
    });
  }
  return txnModel.insertMany(transactions);
}

async function seedUserCourseEnrollments(users, courses) {
  const enrollments = [];
  for (let i = 0; i < 30; i++) {
    enrollments.push({
      user: faker.random.arrayElement(users)._id,
      course: faker.random.arrayElement(courses)._id,
      creator: faker.random.arrayElement(
        users.filter((u) => u.userType === 'teacher')
      )._id,
      enrollDate: faker.date.past(),
      expiryDate: faker.date.future(),
      totalFee: faker.commerce.price(),
      txnId: faker.datatype.uuid(),
      txnStatus: 'COMPLETE'
    });
  }
  return userCourseEnrollModel.insertMany(enrollments);
}

async function seedDatabase() {
  try {
    await dbConnect();

    // console.log('Clearing existing data...');
    // await Promise.all([
    //   userModel.deleteMany({}),
    //   categoryModel.deleteMany({}),
    //   courseModel.deleteMany({}),
    //   videoModel.deleteMany({}),
    //   ratingModel.deleteMany({}),
    //   commentModel.deleteMany({}),
    //   txnModel.deleteMany({}),
    //   userCourseEnrollModel.deleteMany({})
    // ]);

    console.log('Seeding Users...');
    const users = await seedUsers();

    console.log('Seeding Categories...');
    const categories = await categoryModel.find();

    console.log('Seeding Courses...');
    const courses = await seedCourses(users, categories);

    console.log('Seeding Videos...');
    const videos = await seedVideos(courses, users);

    console.log('Seeding Ratings...');
    await seedRatings(users, courses);

    console.log('Seeding Comments...');
    await seedComments(users, videos);

    console.log('Seeding Transactions...');
    await seedTransactions(users);

    console.log('Seeding User Course Enrollments...');
    await seedUserCourseEnrollments(users, courses);

    console.log('Database seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
}

seedDatabase();

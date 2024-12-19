const express = require('express');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser')
const cors = require('cors');
const app = express();
require('dotenv').config();
const port = process.env.PORT || 3000;

app.use(cors({
  origin: ['http://localhost:5173'],
  credentials :true
}));
app.use(express.json());
app.use(cookieParser());

const verifytoken=(req,res,next)=>{
  const token = req?.cookies?.token
  console.log("inside the token");
  
  if (!token) {
    return res.status(401).send({message : "unauthorize access"})
  }
  jwt.verify(token,process.env.JWT_SECRET,(err, decode)=>{
    if (err) {
      return res.status(401).send({message:"Unathorize access"})     
    }
    next();
  })
}
// 'secret'
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.toqnk.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");

    // job relateed api
    const jobscollection = client.db('jobportal').collection('jobs');
    const jobapplication = client.db('jobportal').collection('job_applications');
    // const jobopportunity = client.db('jobportal').collection('job_opportunity')


    // auth related api

    app.post('/jwt', async (req, res) => {
      const user = req.body;

      const token = jwt.sign(user, process.env.JWT_SECRET, { expiresIn: '1h' })
      res.cookie('token', token, {
        httpOnly: true,
        secure: false,

      })
        .send({ success: true });
    })


    app.get('/jobs',verifytoken, async (req, res) => {

      const email = req.query.email;
      let query = {};
      if (email) {
        query = { hr_email: email }

      }
      const cursor = jobscollection.find(query);
      const result = await cursor.toArray();
      res.send(result);
    })
    app.get('/jobs/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await jobscollection.findOne(query);
      res.send(result);
    })

    // get all data
    app.post('/job-applications', async (req, res) => {
      const application = req.body;
      const result = await jobapplication.insertOne(application);

      res.send(result);
    })
    app.get('/job-applications', async (req, res) => {
      const email = req.query.email;
      const query = {
        applicant_email: email
      }
      console.log("cuk cuk cookis ", req.cookies);
      
      const result = await jobapplication.find(query).toArray();
      // fokira way 

      for (const application of result) {
        console.log(application.job_id);
        const query1 = {
          _id: new ObjectId(application.job_id)
        }
        const job = await jobscollection.findOne(query1);
        if (job) {
          application.title = job.title;
          application.company = job.company;
          application.company_logo = job.company_logo;
          application.location = job.location;
        }
      }
      res.send(result)
    })
    // 



    app.post('/jobs', async (req, res) => {
      const application = req.body;
      const result = await jobscollection.insertOne(application);
      console.log(result);

      res.send(result);
    })
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get('/', (req, res) => {
  res.send('Job is falling from the sky')
})

app.listen(port, () => {
  console.log(`job is wating for : ${port}`);
})

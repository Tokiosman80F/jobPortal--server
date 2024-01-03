const express =require('express')
const cors=require('cors')
const app=express()
const port=process.env.port || 3000

app.use(cors())
app.use(express.json())

require('dotenv').config()

app.get('/',(req,res)=>{
    res.send('hello Real world')
})

//------ MongoDb -----

const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = `mongodb+srv://${process.env.BUCKET}:${process.env.BUCKET_SECRET}@cluster0.lyiobzh.mongodb.net/?retryWrites=true&w=majority`;

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
    
    const jobsDB=client.db("jobPortal").collection("jobs")

    // --- get the All job data
    app.get("/allJob",async(req,res)=>{
        
      const result=await jobsDB.find().toArray()
      res.send(result)
    })
   // ---get only user job
    app.get('/myjob/:email',async(req,res)=>{
      const email=req.params.email
      console.log(email);
      const result= await jobsDB.find({email:email}).toArray()
      res.send(result)
    })
    // creating index for search 
    // 1. creating field
    const indexKey={title:1,department:1}
    const indexOption={name:'title-department'}
    const result= await jobsDB.createIndex(indexKey,indexOption)

    app.get('/jobSearching/:text',async(req,res)=>{
      const searchText=req.params.text
      const result=await jobsDB.find({
        $or:[
          {title:{$regex:searchText,$options:'i'}},
          {department:{$regex:searchText,$options:'i'}}
        ]
      }).toArray()
      res.send(result)
    })

    // --- post the job data 
    app.post('/postJob',async(req,res)=>{
        const data=req.body
        console.log(data);
        if(!data){ return res.status(404).send({message:"body data is not found"})}
        const result= await jobsDB.insertOne(data) 
        res.send(result)
    })
    
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);



app.listen(port,()=>{
    console.log(`Running on port ${port}`);
})
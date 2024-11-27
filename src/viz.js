import { dirigent } from "./dirigent.js";

// Create a dataset with randomized data
const data = Array.from({length: 30}, (_, i) => ({
  id: i,
  score: Math.random(),
  hej: Math.random(),
  category: `Category ${Math.ceil(Math.random() * 5)}`
}));

const instructions1 = {data :      data,
                      bindings : {
                                    x : "id", 
                                    y : "score",
                                    size : "score",
                                    color : "category",
                                    text : "category"
                                   }, 
                      labels : {
                          x : "id",
                          y : "score"
                      },
                      
                      layers :   {

                        layer1 :  
                                          {
                                          geometry : "line",
                                          attributes : {
                                            size: 2,
                                            color: "black"
                                                        }
                                          },
                        layer2 :  
                                          {
                                          geometry : "point",
                                          bindings : {
                                            size : "id"
                                          },
                                          attributes : {
                                          stroke: "black"
                                                        }
                                          },
                        layer3 :  
                                          {
                                          geometry : "text",
                                          attributes : {
                                            size: 12,
                                            color : 'black'
                                                        }
                                          },
                                   }
                      };


const instructions2 = {data :      data,
                      bindings : {
                                    x : "id", 
                                    y : "score",
                                    size : 'score',
                                    color : 'category'
                                   }, 
                      
                      layers :   {
                        layer1 :  
                                          {
                                          geometry : "line",
                                          attributes : {
                                            stroke : 'black'
                                          }
                                          }
                                   }};



const instructions3 = {data :      data,
                      bindings : {
                                    x : "category", 
                                    y : "score",
                                    color : "id"
                                   }, 
                      
                      layers :   {
                        layer1 :  
                                          {
                                          geometry : "bar",
                                          attributes : {
                                            stroke : "black",
                                            size : 2
                                          }
                                          }
                                   }};



const plot1 = dirigent("#viz1", instructions1, 700, "plot1")
const plot2 = dirigent("#viz2", instructions2, 400, "plot2")
const plot3 = dirigent("#viz3", instructions3, 600, "plot3")

// rita(data, x = "animal", y = "profit", color = "Company")
//   .bar(kind = "stack", fill = "blue")
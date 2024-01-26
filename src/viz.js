import { dirigent } from "./dirigent.js";

// Create a dataset with randomized data
const data = Array.from({length: 20}, (_, i) => ({
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
                      
                      layers :   {

                        layer1 :  
                                          {
                                          geometry : "line",
                                          attributes : {
                                            size: 2,
                                            // color: "black"
                                                        }
                                          },
                        layer2 :  
                                          {
                                          geometry : "point",
                                          attributes : {
                                          size: 5,
                                          stroke: "black"
                                                        }
                                          },
                        layer3 :  
                                          {
                                          geometry : "text",
                                          attributes : {
                                            // color: 'blue'
                                                        }
                                          },
                                   }
                      };
const instructions2 = {data :      data,
                      bindings : {
                                    x : "id", 
                                    y : "score",
                                    size : "score",
                                    color : "category",
                                    text : "category"
                                  //   stroke: "category"
                                   }, 
                      
                      layers :   {

                        layer1 :  
                                          {
                                          geometry : "line",
                                          attributes : {
                                          size: 2,
                                          color: "blue"
                                                        }
                                          }
                        // layer2 :  
                        //                   {
                        //                   geometry : "point",
                        //                   attributes : {
                        //                     // size: 2,
                        //                     // color: "blue"
                        //                                 }
                        //                   }
                                   }
                      };

// const instructions2 = {data :      data,
//                       bindings : {
//                                     x : "id", 
//                                     y : "score",
//                                     size : "score",
//                                     color : "category",
//                                     text : "category"
//                                   //   stroke: "category"
//                                    }, 
                      
//                       layers :   {

//                         layer1 :  
//                                           {
//                                           geometry : "line",
//                                           attributes : {
//                                           size: 2,
//                                             // color: "blue"
//                                                         }
//                                           },
//                         layer2 :  
//                                           {
//                                           geometry : "point",
//                                           attributes : {
//                                             // size: 2,
//                                             // color: "blue"
//                                                         }
//                                           }
//                                    }
//                       };

const instructions3 = {data :      data,
                      bindings : {
                                    x : "id", 
                                    y : "score",
                                    size : "score",
                                    color : "category",
                                    text : "category"
                                  //   stroke: "category"
                                   }, 
                      
                      layers :   {

                        layer1 :  
                                          {
                                          geometry : "line",
                                          attributes : {
                                            size: 2,
                                            stroke: "black"
                                                        }
                                          },
                        layer2 :  
                                          {
                                          geometry : "point",
                                          attributes : {
                                            // size: 2,
                                            // color: "blue"
                                                        }
                                          }
                                   }
                      };


const plot1 = dirigent("#viz1", instructions1, 800, "plot1")
// const plot2 = dirigent("#viz2", instructions2, 400, "plot2")
// const plot3 = dirigent("#viz3", instructions3, 400, "plot3")

// rita(data, x = "year", y = "profit", text = "Company")
//   .points(fill = "blue")
//   .text()
//   .theme("basic")
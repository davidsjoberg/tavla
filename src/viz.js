import { dirigent } from "./dirigent.js";

// Create a dataset with randomized data
const data = Array.from({length: 15}, (_, i) => ({
  id: i,
  score: Math.random(),
  category: `Category ${Math.ceil(Math.random() * 5)}`
}));


const instructions = {'bindings' : {"x" : "id", 
                                    "y" : "score",
                                    "text" : "category"}, 
                      "data" : data,
                      "layers" : {
                          "layer1" :  {"geom" : "point",
                                       "attributes": {"color" : "black",
                                                      "size" : 70}},
                          "layer2" :  {"geom" : "point",
                                       "attributes": {"color" : "red",
                                                      "size" : 30}},
                          "layer3" :  {"geom" : "text",
                                       "attributes": {"color" : "blue",
                                                      "size" : "small"}}
                                      }
                        };

const divid = "#viz";

dirigent(divid, instructions, 700)

// rita(data)
//   .bindings(x = "year",
//             y = "profit",
//             label = "Company")
//   .points(fill = "blue")
//   .text()
//   .theme("basic")
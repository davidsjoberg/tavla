import { dirigent } from "./dirigent.js";

// Create a dataset with randomized data
const data = Array.from({length: 20}, (_, i) => ({
  id: i,
  score: Math.random(),
  category: `Category ${Math.ceil(Math.random() * 5)}`
}));


const instructions = {'bindings' : {"x" : "id", 
                                    "y" : "score",
                                    "size" : "score",
                                    "text" : "category",
                                    "color" : "category"}, 
                      "data" : data,
                      "layers" : {
                          "layer1" :  {"geom" : "point",
                                       "attributes": {"color" : "grey",
                                                      "size" : 3000}},
                          "layer2" :  {"geom" : "point",
                                       "attributes": {"stroke" : "black"}},
                          "layer34" :  {"geom" : "point",
                                       "attributes": {"color" : "black",
                                      "size" : 30}},
                          "layer3" :  {"geom" : "text",
                                       "attributes": {"size" : "small"}
                                      }
                        }
                      };

const divid = "#viz";

dirigent(divid, instructions, 500)

// rita(x = "year", y = "profit", text = "Company")
//   .points(fill = "blue")
//   .text()
//   .theme("basic")
const uuid = require('uuid');
const bcrypt = require('bcryptjs');
const database = require('../database/dbconfig');

async function createUser(user) {

  await database.initialize();
  const userData = await database.User.findOne({ where: { username: user.username } })
  if (userData) {
    return user.username + " already exists";
  }
  if (user.password) {
    user.hash = await bcrypt.hash(user.password, 10);
  }
  let mod_date = new Date().toISOString().slice(0, 19).replace('T', ' ');

  user.created_time = mod_date;
  user.updated_time = mod_date;
  user.password = user.hash;

  await database.User.create(user);

  const ans = await database.User.findOne({ where: { username: user.username } })
  details = {};
  details.id = ans.id;
  details.username = ans.username;
  details.first_name = ans.first_name;
  details.last_name = ans.last_name;
  details.created_time = ans.created_time;
  details.updated_time = ans.updated_time;

  return details;
}

async function updateUser(data, user) {

  let userData = await database.User.findOne({ where: { username: user.name } })
  if (!userData) {
    return user.username + " user not exists";
  }
  userData = userData.dataValues
  if (data.password) {
    userData.password = await bcrypt.hash(data.password, 10);
  }
  if (data.created_time) {
    delete user.created_time;
  }

  if (data.updated_time) {
    delete user.updated_time;
  }
  if (data.first_name) {
    userData.first_name = data.first_name
  }
  if (data.last_name) {
    userData.last_name = data.last_name
  }
  let mod_date = new Date().toISOString().slice(0, 19).replace('T', ' ');
  userData.updated_time = mod_date
  database.User.update({
    password: userData.password,
    first_name: userData.first_name,
    last_name: userData.last_name,
    updated_time: userData.updated_time
  }, { where: { username: user.name } })

}

async function getUserData({ username, userId }) {
  console.log(userId, "sdfas");
  const data = await database.User.findOne({ where: { username: username } });
  details = {};
  details.id = data.dataValues.id;
  details.username = data.dataValues.username;
  details.first_name = data.dataValues.first_name;
  details.last_name = data.dataValues.last_name;
  details.created_time = data.dataValues.created_time;
  details.updated_time = data.dataValues.updated_time;
  return details;
}


async function createProduct(req,res) {
  try {
    const params = req.body;
    if (await database.Product.findOne({ where: { sku: params.sku } })) {
      res.status(400).send({message: "SKU already exists"});
      return;
    }

    const authUsername = req.a.user.name;
    const authUserData = await database.User.findOne({ where: { username: authUsername } });
    let date_ob = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '')
    params.date_added = date_ob;
    params.date_last_updated = date_ob;
    params.owner_user_id = authUserData.dataValues.id;

    if (!(Number.isInteger(params.quantity) && params.quantity >= 0 && params.quantity <= 100) ) {
        res.status(400).send({message: " Enter a valid quantity"});
        return;
    }

    const product = await database.Product.create(params);
    const ans = await database.Product.findOne({ where: { sku: product.sku } })
    details = {};
    details.name = ans.name;
    details.description = ans.description;
    details.sku = ans.sku;
    details.quantity = ans.quantity;
    details.date_added = ans.date_added;
    details.date_last_updated = ans.date_last_updated;
    details.owner_user_id = ans.owner_user_id;
    return details;
  } catch (error) {
    console.log(error);
    return error;
  }
}

async function getProduct(productId) {
  const product = await database.Product.findByPk(productId);
  if (!product) {
    res.status(400).send({message: "Product is not present in the database'"});
    return;
  }
  return product;
}

async function updateProduct(req, res) {
  const updateProduct = req.body;
  const product = await database.Product.findByPk(req.params.productId);
  if (!product) {
    res.status(400).send({message: "Product is not present in the database'"});
    return;
  }

  let date_ob = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '');
  updateProduct.date_last_updated = date_ob
  
  const authUsername = req.a.user.name;
  const authUserData = await database.User.findOne({ where: { username: authUsername } });
  const userId = authUserData.dataValues.id;

  if (userId != product.dataValues.owner_user_id) {
    res.status(403).send({message: "you are forbidden to update this product"});
    return;
  }

  if (!(Number.isInteger(updateProduct.quantity) && updateProduct.quantity >= 0 && updateProduct.quantity <= 100) ) {
    res.status(400).send({message: " Enter a valid quantity"});
      return;
  }
  const updateBody = await database.Product.findOne({ where: { id: req.params.productId } });

  if (updateBody.dataValues.sku != updateProduct.sku) {
    if (await database.Product.findOne({ where: { sku: updateProduct.sku } })) {
      res.status(400).send({message: "already exists, please enter a different SKU"});
      return;
    }
  }

  Object.assign(product, updateProduct);
  await product.save();
  return (product.get());
}

async function patchProduct(req,res){
  const updateProduct = req.body;
  const product = await database.Product.findByPk(req.params.productId);

  if (!product){
    res.status(400).send({message: "Product is not present in the database'"});
    return;
  }

  let date_ob = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '');
  updateProduct.date_last_updated = date_ob

  const authUsername = req.a.user.name;
  const authUserData = await database.User.findOne({ where: { username: authUsername } });
  const userId = authUserData.dataValues.id;
  if (userId != product.dataValues.owner_user_id) {
    res.status(403).send({message: "you are forbidden to update this product"});
    return;
  }

  if (!(Number.isInteger(updateProduct.quantity) && updateProduct.quantity >= 0 && updateProduct.quantity <= 100) ) {
    res.status(400).send({message: " Enter a valid quantity"});
      return;
  }

  const updateBody = await database.Product.findOne({ where: { id: req.params.productId } });

  if (updateBody.dataValues.sku != updateProduct.sku) {
    if (await database.Product.findOne({ where: { sku: updateProduct.sku } })) {
      res.status(400).send({message: "already exists, please enter a different SKU"});
      return;
    }
  }

  Object.assign(product, updateProduct);
  await product.save();
  return (product.get());

}

async function deleteProduct(productId, req, res) {

  const product = await database.Product.findByPk(productId);
  if (!product) {
    res.status(400).send({message: "This Product is not present in the database'"});
    return;
  }

  const authUsername = req.a.user.name;
  const authUserData = await database.User.findOne({ where: { username: authUsername } });
  const userId = authUserData.dataValues.id;
  if (userId != product.dataValues.owner_user_id) {
    res.status(400).send({message : "Don't have permission to delete"});
    return;
  } 
  else {
    database.Product.destroy({ where: { id: productId } })
    res.status(204).send("successfully deleted the product");
    return ;
  }
  return ;
}

module.exports = {
  getUserData,
  updateUser,
  createUser,
  createProduct,
  getProduct,
  updateProduct,
  patchProduct,
  deleteProduct
}
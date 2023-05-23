var database;
module.exports = function (_database) {
  database = _database;
  module = {
    hasChildPermission,
    getChildData,
    addToHistory,
    getHistory,
    getSpecificHistory,
    hasDocPermission,
  };
  return module;
};
async function hasChildPermission(childid, userid) {
  try {
    var result = await database.query(
      "SELECT id FROM children WHERE id = ? AND parent_id = ?",
      [childid, userid]
    );
    var hasPermission = result && result.length > 0;
    return hasPermission;
  } catch (err) {
    console.log(err);
    return false;
  }
}
async function hasDocPermission(docid, userid) {
  try {
    var result = await database.query(
      "SELECT children.parent_id FROM history join children on children.id = history.child_id where history.id = ? AND children.parent_id = ?;",
      [docid, userid]
    );
    var hasPermission = result && result.length > 0;
    return hasPermission;
  } catch (err) {
    console.log(err);
    return false;
  }
}
async function getChildData(childid) {
  try {
    var result = await database.query(
      "SELECT children.id as child_id," +
        "children.name as child_name, " +
        "children.grade as child_grade, " +
        "users.name as user_name, " +
        "users.address as user_address, " +
        "users.city as user_city, " +
        "children.teacher_name as teacher_name, " +
        "children.teacher_gender as teacher_gender, " +
        "schools.id as school_id, " +
        "schools.name as school_name, " +
        "schools.address as school_address, " +
        "schools.city as school_city " +
        "FROM children join schools on children.school_id = schools.id Join users on children.parent_id = users.id " +
        "WHERE children.id = ?;",
      [childid]
    );
    return result && result.length > 0 ? result[0] : false;
  } catch (err) {
    console.log(err);
    return false;
  }
}
async function addToHistory(childid, document, data) {
  try {
    database.query(
      "INSERT INTO `history`(`child_id`, `document`, `data`) VALUES (?,?,?)",
      [childid, document, data]
    );
  } catch (err) {
    console.log(err);
    return false;
  }
}
async function getHistory(childid) {
  try {
    var result = await database.query(
      "SELECT `id`, `document`, `timestamp` FROM `history` WHERE child_id = ? ORDER BY `id` DESC",
      [childid]
    );
    return result;
  } catch (err) {
    console.log(err);
    return false;
  }
}
async function getSpecificHistory(historyid) {
  try {
    var result = await database.query(
      "SELECT `id`, `document`, `data`, `timestamp` FROM `history` WHERE id = ? ORDER BY `id` DESC",
      [historyid]
    );
    return result && result.length > 0 ? result[0] : false;
  } catch (err) {
    console.log(err);
    return false;
  }
}

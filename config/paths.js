module.exports = {
  staticFiles: (process.env.DATA_FOLDER ||'/tmp/').trim() + '/public',
  logdir: (process.env.LOG_FOLDER||'/var/tmp/').trim() 
};

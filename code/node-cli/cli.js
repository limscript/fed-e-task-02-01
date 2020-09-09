#!/usr/bin/env node

const fs = require('fs')
const path = require('path')
const inquirer = require('inquirer')
const ejs = require('ejs')

inquirer.prompt([
  {
    type: 'input',
    name: 'name',
    message: 'Project name?'
  },
  {
    type: 'list',
    name: 'template',
    message: 'Select the template',
    choices: ['HTML', 'VUE'],
    filter: function(val) {
      return val.toLowerCase();
    },
  },
])
  .then(anwsers => {
    const tmplDir = path.join(__dirname, 'templates')
    const destDir = process.cwd()

    fs.readdir(tmplDir, (err, files) => {
      if (err) throw err
      const reg = new RegExp(`${anwsers.template}$`)
      files = files.filter(file => reg.test(file))
      files.forEach(file => {
        ejs.renderFile(path.join(tmplDir, file), anwsers, (err, result) => {
          if (err) throw err

          fs.writeFileSync(path.join(destDir, file), result)
        })
      })
    })
  })

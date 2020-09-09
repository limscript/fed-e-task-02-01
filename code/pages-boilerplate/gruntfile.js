
const path = require('path');
const sass = require('sass');

const del = require('del');
const browserSync = require('browser-sync');

const loadGruntTasks = require('load-grunt-tasks');
const autoprefixer = require('autoprefixer');
const stylelint = require('stylelint');
const scss = require('postcss-scss');
const reporter = require('postcss-reporter');
const minimist = require('minimist');

const bs = browserSync.create();
const cwd = process.cwd();

const args = minimist(process.argv.slice(2));

const isProd = process.env.NODE_ENV ? process.env.NODE_ENV === 'production' : args.production || args.prod || false;

const bsInit = {
  notify: false,
  port: args.port || 2080,
  open: args.open || false,
};

let config = {
  build: {
    src: 'src',
    dist: 'dist',
    temp: 'temp',
    public: 'public',
    paths: {
      styles: 'assets/styles//.scss',
      scripts: 'assets/scripts//.js',
      pages: '/.html',
      images: 'assets/images//.{jpg,jpeg,png,gif,svg}',
      fonts: 'assets/fonts/*/.{eot,svg,ttf,woff,woff2}',
    },
  },
};

try {
  const loadConfig = require(${ cwd } / pages.config.js);
  config = { ...config, ...loadConfig };
} catch (e) { }

module.exports = (grunt) => {
  grunt.initConfig({
    sass: {
      options: {
        sourceMap: !isProd,
        implementation: sass,
        outputStyle: 'expanded',
      },
      main: {
        expand: true,
        cwd: config.build.src,
        src: [config.build.paths.styles],
        dest: config.build.temp,
        ext: '.css',
      },
    },
    postcss: {
      main: {
        options: {
          processors: [
            autoprefixer(),
          ],
        },
        expand: true,
        cwd: config.build.temp,
        src: ['assets/styles/*/.css'],
        dest: config.build.temp,
      },

      lint: {
        options: {
          processors: [
            stylelint({ fix: args.fix }),
            reporter(),
          ],
        },
        src: `${path.join(config.build.src, config.build.paths.styles)} `,
      },
    },

    eslint: {
      options: {
        fix: args.fix,
      },
      main: `${path.join(config.build.src, config.build.paths.scripts)} `,
    },
    babel: {
      options: {
        sourceMap: !isProd,
        presets: ['@babel/preset-env'],
      },
      main: {
        expand: true,
        cwd: config.build.src,
        src: [config.build.paths.scripts],
        dest: config.build.temp,
        ext: '.js',
      },
    },
    html_template: {
      options: {
        cache: false,
        locals: config.data,
      },
      main: {
        expand: true,
        cwd: config.build.src,
        src: [config.build.paths.pages, '!layouts/**', '!partials/**'],
        dest: config.build.temp,
        ext: '.html',
      },
    },
    imagemin: {
      image: {
        expand: true,
        cwd: config.build.src,
        src: [config.build.paths.images],
        dest: config.build.dist,
      },
      font: {
        expand: true,
        cwd: config.build.src,
        src: [config.build.paths.fonts],
        dest: config.build.dist,
      },
    },
    copy: {
      main: {
        expand: true,
        cwd: config.build.public,
        src: ['**'],
        dest: config.build.dist,
      },
      html: {
        expand: true,
        cwd: config.build.temp,
        src: [config.build.paths.pages],
        dest: config.build.dist,
      },
    },
    useminPrepare: {
      main: {
        expand: true,
        cwd: config.build.temp,
        src: [config.build.paths.pages],
      },
      options: {
        dest: config.build.dist,
        root: [config.build.temp, '.', '..'],
      },
    },

    usemin: {
      main: {
        expand: true,
        cwd: config.build.dist,
        src: [config.build.paths.pages],
      },
      options: {

      },
    },
    'gh-pages': {
      options: {
        base: config.build.dist,
        branch: 'gh-pages-grunt',
      },
      main: ['**'],
    },
    watch: {
      script: {
        files: [`${path.join(config.build.src, config.build.paths.scripts)} `],
        tasks: ['babel'],
      },
      style: {
        files: [`${path.join(config.build.src, config.build.paths.styles)} `],
        tasks: ['style'],
      },
      page: {
        files: [`${path.join(config.build.src, config.build.paths.pages)} `],
        tasks: ['html_template'],
      },
    },
    browserSync: {
      dev: {
        bsFiles: {
          src: [
            config.build.temp,
            config.build.dist,
          ],
        },
        options: {
          ...bsInit,
          watchTask: true,
          server: {
            baseDir: [config.build.temp, config.build.dist, config.build.public, config.build.src],
            routes: {
              '/node_modules': 'node_modules',
            },
          },
        },
      },
      prod: {
        bsFiles: {
          src: config.build.dist,
        },
        options: {
          ...bsInit,
          server: {
            baseDir: config.build.dist,
          },
        },
      },
    },
  });

  loadGruntTasks(grunt);

  grunt.registerTask('reload', () => {
    bs.reload();
  });

  grunt.registerTask('stylesLint', []);

  grunt.registerTask('scriptsLint', []);

  grunt.registerTask('clean', () => {
    del.sync([config.build.dist, config.build.temp, '.tmp']);
  });

  grunt.registerTask('style', ['sass', 'postcss:main']);

  grunt.registerTask('compile', ['style', 'babel', 'html_template']);

  grunt.registerTask('build', [
    'clean',
    'compile',
    'copy',
    'useminPrepare',
    'concat:generated',
    'cssmin:generated',
    'uglify:generated',
    'usemin',
    'imagemin',
  ]);

  grunt.registerTask('serve', ['compile', 'browserSync:dev', 'watch']);

  grunt.registerTask('start', ['build', 'browserSync:prod']);

  grunt.registerTask('deploy', ['build', 'gh-pages']);

  grunt.registerTask('lint', ['postcss:lint', 'eslint']);
};

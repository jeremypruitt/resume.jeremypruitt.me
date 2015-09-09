module.exports = function(grunt) {

 /*
  * Determine the environent to use, based on the "env" commandline option, then load the corresponding
  * environment-specific configuration file.
  */
  var envToUse = grunt.option('env') || 'production';
  var env = require('./environments/' + envToUse + '.js');

  /*
   * Load the S3 configuration file
   */
  var s3 = require('../sensitive_data/s3.js')

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    banner: '/*! <%= pkg.name %> by <%= pkg.author.name %> - v<%= pkg.version %> - ' +
      '<%= grunt.template.today("yyyy-mm-dd") %>\n' +
      '* https://<%= pkg.homepage %>/\n' +
      '* Copyright (c) <%= grunt.template.today("yyyy") %> ' +
      '<%= pkg.author.name %>; */',

    htmlbanner: '<!-- \n\nWelcome :)\n\n' +
      'Source:  <%= pkg.homepage %>\n' +
      'Name:    <%= pkg.name %>\n' +
      'Author:  <%= pkg.author.name %> <<%= pkg.author.email %>>\n' +
      'Version: v<%= pkg.version %>\n' +
      'Date:    <%= grunt.template.today("yyyy-mm-dd") %>\n\n-->',
    
    releaseDirectory: 'releases/<%= pkg.version %>-' + envToUse,
    clean: {
      release : [
        '<%= releaseDirectory %>/'
      ]
    },
    copy: {
      release:{
        files: [
          {
            expand: true,
            cwd: 'src/',
            src:[
              '*.html',
              'js/*'
            ],
            dest: '<%= releaseDirectory %>/'
          }
        ]
      }
    },
    usebanner: {
      html: {
          options: {
              position: 'top',
              banner: '<%= htmlbanner %>'
          },
          files: {
              src: '<%= releaseDirectory %>/index.html'
          }
      }
    },
    aws_s3: {
      release: {
        options: {
          accessKeyId: s3.accessKeyId,
          secretAccessKey: s3.secretAccessKey,
          bucket: env.s3.bucket,
          region: env.s3.region,
          sslEnabled: false,
          params: {
            CacheControl: 'public, must-revalidate, proxy-revalidate, max-age=0'
          }
        },
        files: [
          {
            expand: true,
            dest: '.',
            cwd: '<%= releaseDirectory %>/',
            src: ['**'],
            action: 'upload',
            differential: true
          },
          {
            dest: '/',
            cwd: '<%= releaseDirectory %>/',
            action: 'delete',
            differential: true
          }
        ]
      }
    },
    uncss: {
      dist: {
        files: {
          'src/css/resume.css': ['src/index2.html']
        }
      }
    },
    cssmin: {
      target: {
        files: [{
          expand: true,
          cwd: 'src/css',
          src: ['*.css', '!*.min.css'],
          dest: '<%= releaseDirectory %>/css',
          ext: '.min.css'
        }]
      }
    },
    imagemin: {
       dist: {
          options: {
            optimizationLevel: 5
          },
          files: [{
             expand: true,
             cwd: 'src/img',
             src: ['*.{png,jpg,gif,svg}'],
             dest: '<%= releaseDirectory %>/img'
          }]
       }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-banner');
  grunt.loadNpmTasks('grunt-aws-s3');
  grunt.loadNpmTasks('grunt-uncss');
  grunt.loadNpmTasks('grunt-contrib-cssmin');

  grunt.registerTask('deploy',[
      'clean:release',
      'copy:release',
      'usebanner',
      'aws_s3'
  ]);

};

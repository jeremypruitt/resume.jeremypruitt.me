module.exports = function(grunt) {

 /*
  * Determine the environent to use, based on the "env" commandline option,
  * then load the corresponding environment-specific configuration file.
  */
  var envToUse = grunt.option('env') || 'production';
  var env = require('./environments/' + envToUse + '.js');

  /*
   * Load the S3 configuration file
   */
  var s3 = require('../sensitive_data/s3.js')

  grunt.initConfig({
    /**
     * Read in package.json variables
     */
    pkg: grunt.file.readJSON('package.json'),

    /**
     * Set a release directory for deploying the app
     */
    releaseDirectory: 'releases/<%= pkg.version %>-' + envToUse,

    /**
     * The banner is the comment that is placed at the top of our compiled
     * source files.
     */
    banner: '/**\n\nWelcome :)\n\n' +
      ' * Source:  <%= pkg.homepage %>\n' +
      ' * Name:    <%= pkg.name %>\n' +
      ' * Author:  <%= pkg.author.name %> <<%= pkg.author.email %>>\n' +
      ' * Version: v<%= pkg.version %>\n' +
      ' * Date:    <%= grunt.template.today("yyyy-mm-dd") %>\n\n*/\n',
    htmlbanner: '<!-- \n\nWelcome :)\n\n' +
      'Source:  <%= pkg.homepage %>\n' +
      'Name:    <%= pkg.name %>\n' +
      'Author:  <%= pkg.author.name %> <<%= pkg.author.email %>>\n' +
      'Version: v<%= pkg.version %>\n' +
      'Date:    <%= grunt.template.today("yyyy-mm-dd") %>\n\n-->\n',
    usebanner: {
      html: {
          options: {
              position: 'top',
              banner: '<%= htmlbanner %>'
          },
          files: {
              src: '<%= releaseDirectory %>/resume.html'
          }
      }
    },
    
    /**
     * The directories to delete when `grunt clean` is executed.
     */
    clean: {
      release : [
        '<%= releaseDirectory %>/'
      ]
    },

    /**
     * The `copy` task just copies files from A to B. We use it to copy our
     * project assets (images, fonts, etc.) into the release dir before
     * pushing them to S3.
     */
    copy: {
      release:{
        files: [
          {
            expand: true,
            cwd: 'src/',
            src:['resume.html'],
            dest: '<%= releaseDirectory %>/'
          }
        ]
      }
    },

    /**
     * Deploy to S3
     */
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

    /**
     * Remove unused CSS
     */
    uncss: {
      dist: {
        files: {
          'src/css/resume.css': ['src/resume.html']
        }
      }
    },

    /**
     * Minimize CSS
     */
    cssmin: {
      target: {
        files: [{
          expand: true,
          cwd: 'src/css',
          src: ['resume.css', '!resume.min.css'],
          dest: '<%= releaseDirectory %>/css',
          ext: '.min.css'
        }]
      }
    },
    
    /**
     * Point resume.html to minified css
     */
    processhtml: {
      dist: {
        files: {
        '<%= releaseDirectory %>/resume.html': ['src/resume.html']
        }
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-banner');
  grunt.loadNpmTasks('grunt-aws-s3');
  grunt.loadNpmTasks('grunt-uncss');
  grunt.loadNpmTasks('grunt-contrib-cssmin');
  grunt.loadNpmTasks('grunt-processhtml');

  grunt.registerTask('build',[
      'clean:release',
      'copy:release',
      'uncss',
      'cssmin',
      'processhtml',
      'usebanner'
  ]);

  grunt.registerTask('deploy',[
      'build',
      'aws_s3'
  ]);

};

import Bundler from '../../src/modules/Bundler.js';
import {uglify} from 'rollup-plugin-uglify';
import path from 'path';
import rimraf from 'rimraf';

describe('Bundler', function() {
    let bundler = null;

    afterEach(function() {
        bundler = new Bundler();
        rimraf.sync(path.resolve(__dirname, '../../dist'));
        rimraf.sync(path.resolve(__dirname, '../../lib'));
    });

    describe('#constructor(uglifierPlugin?, otherPlugins?, configPath?)', function() {
        it(`creates a bundler instance`, function() {
            expect(new Bundler()).to.be.a('Bundler');
        });

        it(`can take an optional rollup uglifier plugin object as first parameter`, function() {
            expect(new Bundler(uglify())).to.be.a('Bundler');
        });

        it(`can take an optional array of other plugin options as a second parameter`, function() {
            expect(new Bundler(null, [])).to.be.a('Bundler');
        });

        it(`can take an optional string path denoting the relative location of the config file to
            use as athird parameter`, function() {
            expect(new Bundler(null, null, 'somedirectory/.buildrc.json')).to.be.a('Bundler');
        });
    });

    describe('#getEntryPath(mainFileName)', function() {
        it (`should inspect the path given and return the project root directory just before the
        first node_modules folder`, function() {
            let dirAbsPath = path.join(__dirname, '../../node_modules');
            expect(bundler.getEntryPath(dirAbsPath)).to.equals(path.resolve(__dirname, '../../'));
        });

        it (`should inspect the path given and return the project root directory by moving backward
        in search of the first package.json`, function() {
            let dirAbsPath = path.resolve(__dirname);
            expect(bundler.getEntryPath(dirAbsPath)).to.equals(path.join(dirAbsPath, '../../'));
        });
    });

    describe('#resolveRegex(patterns, regexStore)', function() {
        it (`should resolve the pattern and store it inside the regexStore array`, function() {
            let store = [];
            bundler.resolveRegex('*', store);
            expect(store).to.be.lengthOf(1).and.to.satisfy(store => {
                return store.every(regex => regex instanceof RegExp);
            });
        });

        it (`should simply queue in the pattern into the regexStore array if it is a regex
            object`, function() {
            let store = [], regex = /.*/;
            bundler.resolveRegex(regex, store);
            expect(store).to.be.lengthOf(1).and.to.satisfy(store => {
                return store[0] === regex;
            });
        });

        it (`should iterate through the array and resolve each pattern if argument given is an array
            of patterns`, function() {
            let store = [];
            bundler.resolveRegex(['*', /.*/, 'src/**/*.js'], store);
            expect(store).to.be.lengthOf(3).and.to.satisfy(store => {
                return store.every(regex => regex instanceof RegExp);
            });
        });

        it (`should do nothing if parameter is not an array, string or regex pattern`, function() {
            let store = [];
            bundler.resolveRegex(null, store);
            expect(store).to.be.lengthOf(0);
        });
    });

    describe(`#getModules(modules, resolvedPath, mainModuleFileName, mainModuleName, srcPaths,
        fileExtensions)`, function() {
        it (`should iteratively run throw the given folder and return all modules inside it
        including asset files`, function() {
            let modules = [];
            bundler.getModules(modules, path.resolve(__dirname, '../../src'), 'main.js',
                'Module', [], ['.js']);

            expect(modules).to.be.lengthOf(4);
        });
    });

    describe(`#getExternalModules(modules)`, function() {
        it (`should return a map of all modules abs path plus extension`, function() {
            let modules = [];
            bundler.getModules(modules, path.resolve(__dirname, '../../src'), 'main.js',
                'Module', [], ['.js']);

            let externalModules = bundler.getExternalModules(modules);
            expect(externalModules).to.be.lengthOf(4);
        });
    });

    describe('#process', function() {
        it(`should return array of exports when called`, function() {
            //with uglify
            let bundler = new Bundler(uglify(), []);
            expect(bundler.process()).to.be.an('array');

            //with no uglify
            bundler = new Bundler(null, []);
            expect(bundler.process()).to.be.an('array');

            //use config file does not exist
            bundler = new Bundler(null, [], 'test/config.json');
            expect(bundler.process()).to.be.an('array');

            //use test config 1 json file. it disables lib config bundling
            bundler = new Bundler(null, [], 'test/configs/.buildrc1.json');
            expect(bundler.process()).to.be.an('array').and.lengthOf(0);

            //use test config 2 json file.
            bundler = new Bundler(uglify(), [], 'test/configs/.buildrc2.json');
            expect(bundler.process()).to.be.an('array');
        });
    });
});
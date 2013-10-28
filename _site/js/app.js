angular.module('inquisitor.service', [])
	.value('Data', {
		host: "http://localhost:9200",
		prefix:"index_cetest_",
		query:'{"query" : {"match_all": {}}}',
		highlight: '"highlight":{"order" : "score", "pre_tags" : ["<span class=\'highlight\'>"],"post_tags" : ["</span>"],"fields":{',
		elasticResponse: "",
		elasticError: [],
		currentIndex: "",
		currentType: "",
		mapping: {} ,
		tabs:['Queries', 'Analyzers', 'Tokenizers','Compare'],
		autodetectfield: false,
		colors:["saddlebrown","green","orange","purple","salmon","dodgerblue","firebrick","gold","midnightblue","black","greenyellow","chocolate","aqua","crimson","gray","fuchsia","khaki","red","lightgreen","olive"]
	})
	.value('Analyzer', {
		query: 'the quick brown fox',
		analyzers: ['standard', 'simple', 'whitespace', 'stop', 'keyword', 'pattern', 'snowball'],
		customAnalyzers: {},
		fields: {},
		currentField: {},
		atext: {}
	})
	.value('Tokenizer', {
		query: 'the quick brown fox',
		tokenizers: ['standard', 'keyword', 'edgeNGram', 'nGram', 'letter', 'lowercase', 'whitespace', 'uax_url_email', 'path_hierarchy'],
		tokenizersDefinition: {
			standard:{name:"standard",label:"Standard"},
			ngram4:{name:"ngram4",label:"nGram 4-10",options:{type:"nGram",min_gram:4,max_gram:10}},
			ngram5:{name:"ngram5",label:"nGram 5-10",options:{type:"nGram",min_gram:5,max_gram:10}},
			edgengram4:{name:"edgengram4",label:"Edge nGram 4-10",options:{type:"edgeNGram",min_gram:4,max_gram:10}},
			edgengram5:{name:"edgengram5",label:"Edge nGram 5-10",options:{type:"edgeNGram",min_gram:5,max_gram:10}}
		},
		ttext: {}
	})
	.value('Filter', {
		query: 'the quick brown fox',
		filters: ['standard', 'asciifolding', 'length', 'lowercase', 'nGram', 'edgeNGram',
			'porterStem', 'shingle', 'stop', 'word_delimiter', 'stemmer','keyword_marker',
			'kstem', 'snowball', 'phonetic', 'synonym', 'dictionary_decompounder', 'hyphenation_decompounder',
			'reverse', 'elision', 'truncate', 'unique', 'trim'],
		ftext: {},
		filtersDefinition: {
			standard:{name:"standard",label:"Standard"},
			reverse:{name:"reverse",label:"<span>Reverse</span>",options:{type:"reverse"}},
			lowercase:{name:"lowercase",label:"<span>Lowercase</span>",options:{type:"lowercase"}},
			word_delimiter:{name:"word_delimiter",label:"<span>Word delimiter</span> (découpe les mots suivants plusieurs règles)",options:{type:"word_delimiter"}},
			asciifolding:{name:"asciifolding",label:"<span>Asciifolding</span> (supprime les accents)",options:{type:"asciifolding"}},
			elision:{name:"elision",label:"<span>Elision</span> (Enlève les liaisons : d')",options:{type:"elision",articles:["l","m","t","qu","n","s","j","d"]}},
			stop:{name:"stop",label:"<span>Stopwords</span> (Mots écartés de la recherche, trop communs)",options:{type:"stop",ignore_case:true,stopwords:["alors","au","aucuns","aussi","autre","avant","avec","avoir","bon","car","ce","cela","ces","ceux","chaque","ci","comme","comment","dans","de","des","du","dedans","dehors","depuis","deux","devrait","doit","donc","dos","droite","début","elle","elles","en","encore","essai","est","et","eu","fait","faites","fois","font","force","haut","hors","ici","il","ils","je","juste","la","le","les","leur","là","ma","maintenant","mais","mes","mine","moins","mon","mot","même","ni","nommés","notre","nous","nouveaux","ou","où","par","parce","parole","pas","personnes","peut","peu","pièce","plupart","pour","pourquoi","quand","que","quel","quelle","quelles","quels","qui","sa","sans","ses","seulement","si","sien","son","sont","sous","soyez","sujet","sur","ta","tandis","tellement","tels","tes","ton","tous","tout","trop","très","tu","valeur","voie","voient","vont","votre","vous","vu","ça","étaient","état","étions","été","être"]}},
			snowball:{name:"snowball",label:"<span>Snowball</span> (Cherche la racine francaise)",options:{type:"snowball",language:"French"}},
			double_metaphone:{name:"double_metaphone",label:"<span>Double metaphone</span> (Analyse phonetic, detecte les mots sonnants pareils)",options:{type:"phonetic",encoder:"double_metaphone",replace:false}},
			metaphone:{name:"metaphone",label:"<span>Metaphone</span> (Analyse phonetic-1990)",options:{type:"phonetic",encoder:"metaphone",replace:false}},
			soundex:{name:"soundex",label:"<span>Soundex</span> (Analyse phonetic)",options:{type:"phonetic",encoder:"soundex",replace:false}},
			edgengram5:{name:"edgengram5",label:"<span>edgenGram 3-10</span> (Coupe les mots en parties de 3 a 10c en commencant au debut)",options:{type:'edgeNGram',min_gram:3,max_gram:10}},
			ngram5:{name:"ngram5",label:"<span>nGram 5-10</span> (Coupe les mots en parties de 5 a 10c)",options:{type:'nGram',min_gram:5,max_gram:10}},
			ngram4:{name:"ngram4",label:"<span>nGram 4-10</span> (Coupe les mots en parties de 4 a 10c)",options:{type:'nGram',min_gram:4,max_gram:10}},
			stemmer_light:{name:"stemmer_light",label:"<span>Stemmer light french</span> (Cherche la racine francaise (autre dico))",options:{type:"stemmer",name:"light_french"}},
			stemmer_french:{name:"stemmer_french",label:"<span>Stemmer french</span> (Cherche la racine francaise (autre dico))",options:{type:"stemmer",name:"french"}},
			stemmer_minimal_french:{name:"stemmer_minimal_french",label:"<span>Stemmer minimal french</span> (Cherche la racine francaise (autre dico))",options:{type:"stemmer",name:"minimal_french"}}

		}
	});


var app = angular.module('Inquisitor', ['inquisitor.service', 'ui.bootstrap', 'ui', 'ngSanitize']);
app.factory('pubsub', function(){
	var cache = {};
	return {
		publish: function(topic, args) {
			cache[topic] && $.each(cache[topic], function() {
				this.call(null, args || []);
			});
		},

		subscribe: function(topic, callback) {
			if(!cache[topic]) {
				cache[topic] = [];
			}

			cache[topic].push(callback);
			return [topic, callback];
		},

		unsubscribe: function(handle) {
			var t = handle[0];
			cache[t] && d.each(cache[t], function(idx){
				if(this == handle[1]){
					cache[t].splice(idx, 1);
				}
			});
		}
	}
});

app.config(function ($routeProvider) {
	$routeProvider
		.when('/',
		{
			templateUrl: "views/queries.html"
		})
		.when('/queries',
		{
			templateUrl: "views/queries.html"
		})
		.when('/analyzers',
		{
			templateUrl: "views/analyzers.html"
		})
		.when('/tokenizers',
		{
			templateUrl: "views/tokenizers.html"
		})
		.when('/compare',
		{
			templateUrl: "views/compare.html"
		});
});






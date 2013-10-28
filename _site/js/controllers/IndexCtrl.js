
/* Charge les index de test */
function IndexCtrl($scope,$http,Data,Tokenizer,Filter,pubsub){
	$scope.data = Data;
	$scope.filters = Filter.filtersDefinition;
	$scope.tokenizers = Tokenizer.tokenizersDefinition;
	$scope.indexes = [];
	$scope.pubsub = pubsub;
	$scope.colors = Data.colors;
	$scope.nbExistingIndexes = 0;
	$scope.blabla = "BonjourBen";

	$scope.newIndexes = [];

	$scope.pubsub.subscribe("INFO_CHANGED",function(args){
		$scope.data.prefix = args[1];
		$scope.data.host = args[0];
		$scope.loadIndex();
	});

	$scope.createIndex = function(){
		var id = $scope.indexes.length + $scope.newIndexes.length + 1;
		$scope.newIndexes.push(new Index($scope.data.prefix + id,null,null,$scope.colors[id%$scope.colors.length]));
	}

	$scope.loadIndex = function(){
		$scope.indexes = [];
		$scope.nbExistingIndexes = 0;
		$http.get($scope.data.host + '/_settings').then(function(response){
			var data = response.data;
			var DEF_FIL = "default.filter";
			var IDX_FIL = "default_index.filter";
			var SEA_FIL = "default_search.filter";

			var DEF_TOK = "default.tokenizer";
			var IDX_TOK = "default_index.tokenizer";
			var SEA_TOK = "default_search.tokenizer";
			for(var index in data){
				// On charge uniquement les index de test
				if(index.indexOf($scope.data.prefix) == 0){
					var filtersSelected = [];
					var filtersSearchSelected = [];
					var tokenizer = null;
					var tokenizerSearch = null;
					var isDifferentsAnalyzers = false;	// Indique les analyzers differents index / search
					for(var setting in data[index].settings){
						// On test s'il y a un analyzer d'index et de recherche
						if(setting.indexOf(".default_search.")!=-1 || setting.indexOf("default_index")!=-1){
							isDifferentsAnalyzers = true;
						}
						// Ajout de filtre
						if(setting.indexOf(DEF_FIL)!=-1 || setting.indexOf(IDX_FIL)!=-1){
							var pos = (isDifferentsAnalyzers)?
								setting.substr(setting.indexOf(DEF_FIL) + 18):
								setting.substr(setting.indexOf(IDX_FIL) + 18);
							filtersSelected[filtersSelected.length] = $scope._getInfo($scope.filters,data,index,setting,pos);
						}
						if(setting.indexOf(SEA_FIL)!=-1){
							var pos = setting.substr(setting.indexOf(SEA_FIL) + 18);
							filtersSearchSelected[filtersSearchSelected.length] = $scope._getInfo($scope.filters,data,index,setting,pos);
						}
						if(setting.indexOf(DEF_TOK)!=-1 || setting.indexOf(IDX_TOK)!=-1){
							if($scope.tokenizers!=null && $scope.tokenizers[data[index].settings[setting]] != null){
								tokenizer = $scope._getInfo($scope.tokenizers,data,index,setting);
							}
						}
						if(setting.indexOf(SEA_TOK)!=-1){
							if($scope.tokenizers!=null && $scope.tokenizers[data[index].settings[setting]] != null){
								tokenizerSearch = $scope._getInfo($scope.tokenizers,data,index,setting);
							}
						}
					}
					// On (trie les filtres)
					filtersSelected.sort(function(a,b){
						return (a.pos == b.pos)?0:(a.pos > b.pos)?1:-1;
					});
					filtersSearchSelected.sort(function(a,b){
						return (a.pos == b.pos)?0:(a.pos > b.pos)?1:-1;
					});

					var indexObject = new Index(index,tokenizer,filtersSelected,$scope.colors[$scope.nbExistingIndexes],true);
					if(isDifferentsAnalyzers){
						indexObject.setSearch(tokenizerSearch,filtersSearchSelected);
						indexObject.tokenizerSearch = tokenizerSearch;
						indexObject.filtersSearch = filtersSearchSelected;
					}
					$scope.indexes.push(indexObject);
					$scope.nbExistingIndexes++;
					// On affiche l'index
					//var div = $('<div></div>');
					//$('#idListeExistingIndexes').append(div);
					//showCreatedIndex(indexObject,div);
				}

			}
		});
	}



	$scope._getInfo = function(elem,data,index,setting,pos){
		return new Element(elem[data[index].settings[setting]].name,elem[data[index].settings[setting]].options,pos);
	}
}


function Element(name,options,pos){
	this.name=name;
	this.options = options;
	this.pos = pos;
}

function Index(index,tokenizer,filters,color,existing){
	this.id = index;
	this.color = color;
	this.tokenizer = tokenizer;
	this.filters = filters;
	this.existing = existing;	// Indique que l'index existe deja, on ne peut pas le creer
	this.tokenizerSearch = null;	// ces 2 champs sont utilises uniquement quand l'analyzer de recherche et d'index sont differents
	this.filtersSearch = null;
	this.different = false;

	this.setSearch = function(tokenizerSearch,filtersSearch){
		this.tokenizerSearch = tokenizerSearch;
		this.filtersSearch = filtersSearch;
		this.different = this.tokenizerSearch!=null && this.filtersSearch!=null;
	}
	this.getJSON = function(){
		if(this.existing){return;}
		var isAnalyzersDifferent = this.hasDifferentsAnalyzers();
		var filtersArray = ["standard"];	// Liste des filtres pour l'indexation
		var filtersSearchArray = ["standard"];	// Liste des filtres pour la recherche.
		var filtersDefinitions = {};	// Tous les filtres, même ceux de filtersSearch
		$(this.filters).each(function(i){
			filtersArray[i+1] = this.name;
			if(this.options!=null){
				filtersDefinitions[this.name] = this.options;
			}
		});

		var tokenizerDefinition = {};
		if(tokenizer.options!=null){
			tokenizerDefinition[tokenizer.name] = tokenizer.options;
		}
		// Cas des analyzers differents
		if(isAnalyzersDifferent){
			$(this.filtersSearch).each(function(i){
				filtersSearchArray[i+1] = this.name;
				if(this.options!=null){
					filtersDefinitions[this.name] = this.options;
				}
			});
			if(this.tokenizerSearch.options!=null){
				tokenizerDefinition[this.tokenizerSearch.name] = this.tokenizerSearch.options;
			}
		}
		var index =  {analysis:{filter:filtersDefinitions,tokenizer:tokenizerDefinition,
			analyzer:{
				'indexanalyzer':{type:"custom",tokenizer:this.tokenizer.name,filter:filtersArray}
			}}
		};
		// Si les analysers search et index sont indentiques, on copie la conf
		if(isAnalyzersDifferent){
			return {analysis:{filter:filtersDefinitions,tokenizer:tokenizerDefinition,
				analyzer:{
					'default_index':{type:"custom",tokenizer:this.tokenizer.name,filter:filtersArray},
					'default_search':{type:"custom",tokenizer:this.tokenizerSearch.name,filter:filtersSearchArray}
				}}
			};
		}
		else{
			return {analysis:{filter:filtersDefinitions,tokenizer:tokenizerDefinition,
				analyzer:{
					'default':{type:"custom",tokenizer:this.tokenizer.name,filter:filtersArray}
				}}
			};
		}
	}

	this.showFilters = function(filters){
		var strFilters = "";
		$(filters).each(function(i){
			strFilters += this.name + ', ';
		});

		return strFilters;
	}
}
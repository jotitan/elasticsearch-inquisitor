
function CompareInput($scope,$http,$filter,Data,pubsub){
	$scope.data = Data;
	$scope.pubsub = pubsub;

	$scope.infoChanged = function(){
		$scope.pubsub.publish('INFO_CHANGED', [$scope.data.host,$scope.data.prefix]);
	}
}

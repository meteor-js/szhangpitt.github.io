function loadData() {
    angular.element(document.getElementById("appBody")).scope().$apply(
        function($scope) {
            $scope.getLinkedInData();
        });
}
$(document).ready(function(){
    setTimeout(function(){
        $('html,body').animate({scrollTop: 0}, 800);
    }, 400);
    
});
// var SHAOPENG_LINKIEDIN_ID = 'qC72fmJGlB';
var appModule = angular.module('tagdemo', ['ngRoute']);

appModule.controller('AppController', ['$scope', '$rootScope', 'TagService', '$location',
    function ($scope, $rootScope, TagService, $location) {
        $scope.$location = $location;
        var linkedInId = getUrlVars()['view'] === 'shaopeng' && 'shaopeng' || 'me';
        var publicProfileUrl = encodeURIComponent('www.linkedin.com/in/shaopengzhang/');

        if(linkedInId === 'me') {
            $scope.staticApp = false;
            //$scope.getLinkedInData() will be called by loadData onAuth linkedIn handler
        }
        else if(linkedInId === 'shaopeng'){
            $scope.staticApp = true;
            getStaticData();
        } 

        //iphone: landspace 568x212, vertical 320x460
        $scope.possiblyOnMobile = window.innerWidth <= 568;

        $scope.getLinkedInData = function() {
            IN.API.Profile()
            .ids(linkedInId)
            .fields(['id', 'firstName', 'lastName', 'summary', 'educations', 'pictureUrls::(original)','headline','publicProfileUrl', 'skills', 'positions', 'projects'])
            .result(function(result) {
                console.log(result);
                profile = result.values[0];
                TagService.loadProfile(profile);
            });
        }

        function getStaticData() {
            TagService.loadProfile(null);
        }

        $scope.getPeopleData = function() {
            var rawUrl = '/people/id=' + linkedInId + ':(id,first-name,last-name,headline,picture-urls::(original),summary,educations,skills,positions,public-profile-url)';
            IN.API.Raw()
            .result(function(results) {
                console.log(results);
            });
        }

        $scope.linkedInLoaded = function() {
            return IN;
        }

        $scope.linkedInAuthenticated = function() {
            return IN && IN.ENV && IN.ENV.auth && IN.ENV.auth.oauth_token;
        }


    // Read a page's GET URL variables and return them as an associative array.
    function getUrlVars()
    {
        var vars = [], hash;
        var hashes = window.location.href.slice(window.location.href.indexOf('?') + 1).split('&');
        for(var i = 0; i < hashes.length; i++)
        {
            hash = hashes[i].split('=');
            vars.push(hash[0]);
            vars[hash[0]] = hash[1];
        }
        return vars;
    }
}]);

appModule.controller('UIController', ['$scope', '$rootScope', 'TagService', 
    function ($scope, $rootScope, TagService) {
        $scope.SHAOPENG_LINKIEDIN_ID = TagService.SHAOPENG_LINKIEDIN_ID;
        $scope.loadPercentage = {
            linkedIn:   0,
            summary:    0,
            educations: 0,
            skills:     0,
            positions:  0,
        };

        var imgLoadInterval, tagLoadInterval, advLoadInterval;

        $scope.$on('PROFILE', function(event, data) {
            //$scope.$apply(function() {
                $scope.loadPercentage.linkedIn = 100;
                $scope.completeSection(0);

                $scope.profile = TagService.profile;   
                $scope.summary = TagService.profile.summary;  
                $scope.educations = TagService.educations;   
                $scope.skills = TagService.skills;
                $scope.positions = TagService.positions;    
           // });
    });

        $scope.$on('PROFILE_ALL', function(event, data) {
            $scope.linkedInLoadPercentage = 100;
            $scope.completeSection(0);
            //$scope.$apply();
        });

        $scope.findSchoolLogoUrlFromCompay = function(schoolName) {
            var companyUrlMap = TagService.companyUrlMap;
            for (key in companyUrlMap) {
                var company = companyUrlMap[key];
                console.log('look for: ', companyUrlMap[key]);
                if(company.name && company.logoUrl && company.name === schoolName) {
                    return company.logoUrl;
                }
            }
            return false;
        }

        $scope.displaySectionContent = function(section, contentProperty) {
            $scope.loadPercentage[contentProperty] = 0;
            
            if($scope[contentProperty]) {
                $scope.loadPercentage[contentProperty] = 100;
                $scope.completeSection(section);
                // $scope.$apply();
            }
        }

        $scope.maxValue = function(tags) {
            if(tags.length && tags.length > 0) {
                var max = -999;
                for (var i = 0, len = tags.length; i < len; i++) {
                    if (tags[i].value > max) {
                        max = tags[i].value;
                    }
                }
                return max;
            }
            return 100;
        }
        
        $scope.twinkleStyle = function(value, loadPercentage) {
            var transitionString = 'top 0.4s ease ' +  (value * 3).toFixed(2) + 's' + ',' + 'opacity 0.4s ease ' +  value * 3 + 's' + ';';// + ',' + 'transform 0.4s ease ' + ';';
            var animationDelayString = (10 + value * 6) + 's' + ';'; 
            var styleString = 'font-size: ' + (16 + value * 12) + 'px' + ';' +
            'line-height: ' + '1.5' + ';' +
            /*'top: ' + (loadPercentage === 100) && '0' || '10px' + ';' +*/
            '-webkit-transition: ' + transitionString +
            '-moz-transition: ' + transitionString +
            'transition: ' + transitionString +
            '-webkit-animation-delay: ' + animationDelayString +
            '-moz-animation-delay: ' + animationDelayString +
            'animation-delay: ' + animationDelayString;

            return styleString;

        }

        // $scope.tagBaseHeight = function(value) {
        //     return Math.min(28, 8 + value * 32);
        // }

        $scope.completeSection = function(step) {
            $scope.completedSection = step;
        }


        $scope.scrollToSection = function(step) {
            //$('#step' + step).height(window.innerHeight);
            $('html,body').animate({
                scrollTop: $('#step' + step).offset().top
            }, 400);
        }

        $scope.visible = function(identifier) {
            if (identifier === 'linkedIn') {
                return  $scope.loadPercentage[identifier] > 0;
            }

            else {
                return $scope.loadPercentage[identifier] === 100;
            }
        }


    }]);



appModule.service('TagService', ['$http', '$rootScope', '$q', function ($http, $rootScope, $q) {
    
    var that = this;

    // this.SHAOPENG_LINKIEDIN_ID = 'qC72fmJGlB';

    this.companyUrlMap = {};
    this.companyUrlMap[1043] =  {id: 1043, logoUrl: "https://media.licdn.com/mpr/mpr/p/3/005/07b/00a/05def42.png", name: "Siemens"};
    this.companyUrlMap[507720] = {id: 507720, logoUrl: "https://media.licdn.com/mpr/mpr/p/3/000/032/14c/0fad638.png", name: "Beijing Jiaotong University"} ;
    this.companyUrlMap[3461] = {id: 3461, logoUrl: "https://media.licdn.com/mpr/mpr/p/7/000/2b5/1b3/37aeefe.png", name: "University of Pittsburgh"};
    
    this.getTags = function() {
        var promise = $http.get('api/tags.json').then(function(response) {
            return response.data;
        });
        return promise;
    }

    this.getStaticAdvs = function() {
        var promise = $http.get('api/advs.json').then(function(response) {
            return response.data;
        });
        return promise;
    }

    this.loadProfile = function(INProfile) {
        if(INProfile) {
            that.profile = INProfile;
            that.positions = groupPositionByYear(INProfile.positions);  

            that.skills = flattenSkills(INProfile.skills);
            that.educations = INProfile.educations.values;
            
            console.log(that.profile);
            getCompanyLogos(INProfile.positions).then(function(result){
                console.log(result);
                that.positions = groupPositionByYear(result);
                console.log(that.positions);
                // $rootScope.$broadcast('PROFILE_ALL', null);
            });

            $rootScope.$broadcast('PROFILE', null);
        }
        else if(INProfile === null) {
            $http.get('api/shaopeng_linkedin_profile.json').success(function(data){
                var INProfile = data;
                that.profile = INProfile;
                that.positions = groupPositionByYear(INProfile.positions);  

                that.skills = flattenSkills(INProfile.skills);
                that.educations = INProfile.educations.values;
                
                console.log(that.profile);
                that.positions = getStaticCompanyLogos(INProfile.positions);
                that.positions = groupPositionByYear(that.positions);
                console.log(that.positions);
                $rootScope.$broadcast('PROFILE', null);

                // $rootScope.$broadcast('PROFILE', null);
            });
        }
        
    }

    function flattenSkills(INSkills) {
        var skills = INSkills.values || [];
        var a = [];

        if(angular.isArray(skills)){
            skills.forEach(function(element, index, array) {
                if(element.skill) {
                    a.push({name: element.skill.name, value: Math.random()});
                }
            });
        }

        return a;
    }

    function getStaticCompanyLogos(INPositions) {
        if(INPositions.values && angular.isArray(INPositions.values)) {
            for (var i = 0; i < INPositions.values.length; i++ ) {
                INPositions.values[i].logoUrl = that.companyUrlMap[INPositions.values[i].id];
            }
        }
        return INPositions;
    }

    function asyncLogoUrl(id) {
        var deferred = $q.defer();

        if(that.companyUrlMap[id]) {
            var results = that.companyUrlMap[id];
            deferred.resolve(results);
            console.log('Yay! Saved one API call, found company object in cache: ', results);
        }
        else {
            IN.API.Raw('/companies/id=' + id + ':(id,name,logo-url)')
            .result(function(results) {
                if (results.logoUrl) {
                    // position.logoUrl = results.logoUrl;
                    console.log('asyncLogoUrl', results);
                    this.companyUrlMap[id] = results;
                    deferred.resolve(results);
                }
                else {
                    deferred.reject(results);    
                }
                
            })
            .error(function(error){
                //in case of network error, throttle, etc.
                console.error('asyncLogoUrl error: ', angular.toJson(error, true))
                deferred.reject(error);
            });            
        }


        return deferred.promise;
    }

    function getCompanyLogos(INPositions) {
        var deferred = $q.defer();

        var positions = INPositions.values || [];
        var b = [];
        positions.forEach(function(position, index, array) {
            if(position.company && position.company.id) {
                var promise = asyncLogoUrl(position.company.id);
                var newPromise = promise.then(function(success) {
                    position.logoUrl = success.logoUrl;
                    return position;
                });
                b.push(newPromise);
            }
        });

        $q.all(b).then(function(result) {
            // console.log('---all---', result);
            // console.log('---all---', angular.toJson(result, true));
            deferred.resolve(result);
        });

        return deferred.promise;
    }

    function groupPositionByYear(positionsArray) {
        var positions = [];

        if(angular.isArray(positionsArray)) {
            positions = positionsArray;
        }
        else if(positionsArray.values && angular.isArray(positionsArray.values)) {
            positions = positionsArray.values;
        }
        
        var a = [];

        if(angular.isArray(positions)) {

            var even = 0;
            positions.forEach(function(position, index, array) {


                if (a.length === 0) {
                    //push this year first
                    if(position.startDate.year !== new Date().getFullYear()) {
                        a.push({mark: new Date().getFullYear()});
                    }
                    //on the first position, push a year mark first
                    a.push({mark: position.startDate.year});
                    position.even = even;
                    a.push(position);
                    even = 1 - even;
                }
                else {
                    //second one and on, compare with the previous one,                 
                    var lastPosition = a[a.length - 1];
                    //if it starts in the new year, then push a year mark first
                    if (lastPosition.startDate.year !== position.startDate.year) {
                        a.push({mark: position.startDate.year});
                    }
                    //if it is in the same year, just push the position
                    position.even = even;
                    a.push(position);
                    
                    even = 1 - even;
                }
            });
}
return a;
}

}]);


appModule.directive('loadProgressIcon', [function () {
    return {
        restrict: 'A',
        replace: true,
        scope: {
            iconclass: '@', 
            progress: '@', 
            reverse: '@'
        },
        template: '<div class="glyph-progress" ng-class="{\'reverse\': reverse}"> \
        <div class=" view-port" ng-class="{\'fg\': reverse, \'bg\': !reverse}"><span class="{{iconclass}}"></span></div>    \
        <div class=" view-port" ng-class="{\'bg\': reverse, \'fg\': !reverse}"><span class="{{iconclass}}"></span></div>   \
        </div>',
        link: function (scope, element, attrs) {
            scope.$watch('progress', function(newValue, oldValue) {
                console.log('loadProgressIcon.progress = ', newValue, oldValue);
                if(parseInt(newValue) === 100) {
                    setTimeout(function(){
                        element.addClass('loaded');
                    },100)
                    
                }
                else if(parseInt(newValue) === 0) {
                    setTimeout(function(){
                        element.removeClass('loaded');
                    }, 100);
                    
                }
            })
        }
    };
}]);

 /*template: '<div class="glyph-progress"> \
        <div class=" view-port" ng-class="{\'fg\': reverse, \'bg\': !reverse}"><span class="{{iconclass}}"></span></div>    \
        <div class=" view-port" ng-class="{\'bg\': reverse, \'fg\': !reverse}" style="height: {{reverse && progress || (100 - progress)}}%"><span class="{{iconclass}}"></span></div>   \
        </div>',*/


appModule.filter('intToMonth', function(){
    return function(input) {
        var map = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        input = parseInt(input);
        if (input > 0 && input < 13) {
            return map[input - 1];
        }
        return '';
    }
});

appModule.filter('forHowLong', function(){
    return function(position) {
        if (position.isCurrent) {
            // return 'till now'
            var now = new Date();

            position.endDate = {
                year: now.getFullYear(),
                month: now.getMonth() + 1
            }
        }
        
        if (position.startDate && position.endDate) {
            var yearLong = position.endDate.year - position.startDate.year,
            monthLong = position.endDate.month - position.startDate.month;
            
            if (monthLong < 0) {
                var totalLongInMonth = yearLong * 12 + monthLong;
                yearLong = Math.floor(totalLongInMonth / 12);
                monthLong = 12 + monthLong;
            }

            var yearUnit = yearLong > 1 ? 'years' : 'year',
            monthUnit = monthLong > 1 ? 'months' : 'month';

            var yearString = yearLong > 0 ? yearLong + ' ' + yearUnit + ' ' : '',
            monthString = monthLong > 0? monthLong + ' ' + monthUnit : '';

            var wholeString = yearString + monthString + (position.isCurrent ? ' till now' : '');

            return wholeString;
        }

        return '';
    }
});

appModule.directive('breakAtN', [function () {
    return {
        restrict: 'A',
        replace: true,
        scope: {
            content: '@'
        },
        link: function (scope, element, attrs) {

            //linkedin API will remove line breaks, here we add them back in before "...(n)" where n > 1
            attrs.$observe('content', function(value){
                // var htmlString = value.replace(/\s+\(\d*\)/g, function(v) {
                //     return ' <br>' + v;
                // });
            var htmlString = value.replace(/\n/g, function(v) {
                return ' <br>';
            });

            element.html(htmlString);
            element.append('<div class="mask"></div>');
        });     

        }
    };
}]);

appModule.directive('clickAddClass', [function () {
    return {
        restrict: 'A',
        scope: {
            toggleclass: '@'
        },
        link: function (scope, element, attrs) {
            element.on('click', function(e){
                element.addClass('expanded');
            })
        }
    };
}]);

appModule.directive('visibleOnMark', [function () {
    return {
        restrict: 'A',
        scope: {
            mark: '@'
        },
        link: function (scope, element, attrs) {
            scope.$watch('mark', function(newValue, oldValue) {
                if(newValue === 'true') {
                    setTimeout(function() {
                        element.addClass('visible');
                    }, 100);
                }
                else {
                    setTimeout(function() {
                        element.removeClass('visible');
                    }, 100);
                }
            });
        }
    };
}])


/*appModule.directive('twinkleTag', [function () {
    return {
        restrict: 'A',
        scope: {
            name: '@', 
            value: '@'
        },
        link: function (scope, element, attrs) {
            console.log('twinkleTag', scope.name, scope.value);
            var name = scope.name,
                value = parseInt(scope.value);

            element.css({
                'font-size': (16 + skill.value * 24) + 'px', 
                'line-height': '1.5', 
                'transition': 'top 0.4s ease ' +  (skill.value) * 3 + 's' + ',' + 'opacity 0.4s ease ' +  skill.value * 3 + 's' + ',' + 'transform 0.4s ease ', 
                'top': (loadPercentage.skills === 100) && '0' || '10px', 
                'animation-delay': (10 + skill.value * 6) + 's'
            });

        }
    };
}])*/
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpbmtlZGluLmpzIiwiYXBwLmpzIiwic2VydmljZS5qcyIsImhlbHBlci5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNMQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUM1TEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ2pNQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImFsbC5qcyIsInNvdXJjZXNDb250ZW50IjpbImZ1bmN0aW9uIGxvYWREYXRhKCkge1xyXG4gICAgYW5ndWxhci5lbGVtZW50KGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiYXBwQm9keVwiKSkuc2NvcGUoKS4kYXBwbHkoXHJcbiAgICAgICAgZnVuY3Rpb24oJHNjb3BlKSB7XHJcbiAgICAgICAgICAgICRzY29wZS5nZXRMaW5rZWRJbkRhdGEoKTtcclxuICAgICAgICB9KTtcclxufSIsIiQoZG9jdW1lbnQpLnJlYWR5KGZ1bmN0aW9uKCl7XHJcbiAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCl7XHJcbiAgICAgICAgJCgnaHRtbCxib2R5JykuYW5pbWF0ZSh7c2Nyb2xsVG9wOiAwfSwgODAwKTtcclxuICAgIH0sIDQwMCk7XHJcbiAgICBcclxufSk7XHJcbi8vIHZhciBTSEFPUEVOR19MSU5LSUVESU5fSUQgPSAncUM3MmZtSkdsQic7XHJcbnZhciBhcHBNb2R1bGUgPSBhbmd1bGFyLm1vZHVsZSgndGFnZGVtbycsIFsnbmdSb3V0ZSddKTtcclxuXHJcbmFwcE1vZHVsZS5jb250cm9sbGVyKCdBcHBDb250cm9sbGVyJywgWyckc2NvcGUnLCAnJHJvb3RTY29wZScsICdUYWdTZXJ2aWNlJywgJyRsb2NhdGlvbicsXHJcbiAgICBmdW5jdGlvbiAoJHNjb3BlLCAkcm9vdFNjb3BlLCBUYWdTZXJ2aWNlLCAkbG9jYXRpb24pIHtcclxuICAgICAgICAkc2NvcGUuJGxvY2F0aW9uID0gJGxvY2F0aW9uO1xyXG4gICAgICAgIHZhciBsaW5rZWRJbklkID0gZ2V0VXJsVmFycygpWyd2aWV3J10gPT09ICdzaGFvcGVuZycgJiYgJ3NoYW9wZW5nJyB8fCAnbWUnO1xyXG4gICAgICAgIHZhciBwdWJsaWNQcm9maWxlVXJsID0gZW5jb2RlVVJJQ29tcG9uZW50KCd3d3cubGlua2VkaW4uY29tL2luL3NoYW9wZW5nemhhbmcvJyk7XHJcblxyXG4gICAgICAgIGlmKGxpbmtlZEluSWQgPT09ICdtZScpIHtcclxuICAgICAgICAgICAgJHNjb3BlLnN0YXRpY0FwcCA9IGZhbHNlO1xyXG4gICAgICAgICAgICAvLyRzY29wZS5nZXRMaW5rZWRJbkRhdGEoKSB3aWxsIGJlIGNhbGxlZCBieSBsb2FkRGF0YSBvbkF1dGggbGlua2VkSW4gaGFuZGxlclxyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIGlmKGxpbmtlZEluSWQgPT09ICdzaGFvcGVuZycpe1xyXG4gICAgICAgICAgICAkc2NvcGUuc3RhdGljQXBwID0gdHJ1ZTtcclxuICAgICAgICAgICAgZ2V0U3RhdGljRGF0YSgpO1xyXG4gICAgICAgIH0gXHJcblxyXG4gICAgICAgIC8vaXBob25lOiBsYW5kc3BhY2UgNTY4eDIxMiwgdmVydGljYWwgMzIweDQ2MFxyXG4gICAgICAgICRzY29wZS5wb3NzaWJseU9uTW9iaWxlID0gd2luZG93LmlubmVyV2lkdGggPD0gNTY4O1xyXG5cclxuICAgICAgICAkc2NvcGUuZ2V0TGlua2VkSW5EYXRhID0gZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgIElOLkFQSS5Qcm9maWxlKClcclxuICAgICAgICAgICAgLmlkcyhsaW5rZWRJbklkKVxyXG4gICAgICAgICAgICAuZmllbGRzKFsnaWQnLCAnZmlyc3ROYW1lJywgJ2xhc3ROYW1lJywgJ3N1bW1hcnknLCAnZWR1Y2F0aW9ucycsICdwaWN0dXJlVXJsczo6KG9yaWdpbmFsKScsJ2hlYWRsaW5lJywncHVibGljUHJvZmlsZVVybCcsICdza2lsbHMnLCAncG9zaXRpb25zJywgJ3Byb2plY3RzJ10pXHJcbiAgICAgICAgICAgIC5yZXN1bHQoZnVuY3Rpb24ocmVzdWx0KSB7XHJcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhyZXN1bHQpO1xyXG4gICAgICAgICAgICAgICAgcHJvZmlsZSA9IHJlc3VsdC52YWx1ZXNbMF07XHJcbiAgICAgICAgICAgICAgICBUYWdTZXJ2aWNlLmxvYWRQcm9maWxlKHByb2ZpbGUpO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGZ1bmN0aW9uIGdldFN0YXRpY0RhdGEoKSB7XHJcbiAgICAgICAgICAgIFRhZ1NlcnZpY2UubG9hZFByb2ZpbGUobnVsbCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAkc2NvcGUuZ2V0UGVvcGxlRGF0YSA9IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgICB2YXIgcmF3VXJsID0gJy9wZW9wbGUvaWQ9JyArIGxpbmtlZEluSWQgKyAnOihpZCxmaXJzdC1uYW1lLGxhc3QtbmFtZSxoZWFkbGluZSxwaWN0dXJlLXVybHM6OihvcmlnaW5hbCksc3VtbWFyeSxlZHVjYXRpb25zLHNraWxscyxwb3NpdGlvbnMscHVibGljLXByb2ZpbGUtdXJsKSc7XHJcbiAgICAgICAgICAgIElOLkFQSS5SYXcoKVxyXG4gICAgICAgICAgICAucmVzdWx0KGZ1bmN0aW9uKHJlc3VsdHMpIHtcclxuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKHJlc3VsdHMpO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgICRzY29wZS5saW5rZWRJbkxvYWRlZCA9IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgICByZXR1cm4gSU47XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAkc2NvcGUubGlua2VkSW5BdXRoZW50aWNhdGVkID0gZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBJTiAmJiBJTi5FTlYgJiYgSU4uRU5WLmF1dGggJiYgSU4uRU5WLmF1dGgub2F1dGhfdG9rZW47XHJcbiAgICAgICAgfVxyXG5cclxuXHJcbiAgICAvLyBSZWFkIGEgcGFnZSdzIEdFVCBVUkwgdmFyaWFibGVzIGFuZCByZXR1cm4gdGhlbSBhcyBhbiBhc3NvY2lhdGl2ZSBhcnJheS5cclxuICAgIGZ1bmN0aW9uIGdldFVybFZhcnMoKVxyXG4gICAge1xyXG4gICAgICAgIHZhciB2YXJzID0gW10sIGhhc2g7XHJcbiAgICAgICAgdmFyIGhhc2hlcyA9IHdpbmRvdy5sb2NhdGlvbi5ocmVmLnNsaWNlKHdpbmRvdy5sb2NhdGlvbi5ocmVmLmluZGV4T2YoJz8nKSArIDEpLnNwbGl0KCcmJyk7XHJcbiAgICAgICAgZm9yKHZhciBpID0gMDsgaSA8IGhhc2hlcy5sZW5ndGg7IGkrKylcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGhhc2ggPSBoYXNoZXNbaV0uc3BsaXQoJz0nKTtcclxuICAgICAgICAgICAgdmFycy5wdXNoKGhhc2hbMF0pO1xyXG4gICAgICAgICAgICB2YXJzW2hhc2hbMF1dID0gaGFzaFsxXTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIHZhcnM7XHJcbiAgICB9XHJcbn1dKTtcclxuXHJcbmFwcE1vZHVsZS5jb250cm9sbGVyKCdVSUNvbnRyb2xsZXInLCBbJyRzY29wZScsICckcm9vdFNjb3BlJywgJ1RhZ1NlcnZpY2UnLCBcclxuICAgIGZ1bmN0aW9uICgkc2NvcGUsICRyb290U2NvcGUsIFRhZ1NlcnZpY2UpIHtcclxuICAgICAgICAkc2NvcGUuU0hBT1BFTkdfTElOS0lFRElOX0lEID0gVGFnU2VydmljZS5TSEFPUEVOR19MSU5LSUVESU5fSUQ7XHJcbiAgICAgICAgJHNjb3BlLmxvYWRQZXJjZW50YWdlID0ge1xyXG4gICAgICAgICAgICBsaW5rZWRJbjogICAwLFxyXG4gICAgICAgICAgICBzdW1tYXJ5OiAgICAwLFxyXG4gICAgICAgICAgICBlZHVjYXRpb25zOiAwLFxyXG4gICAgICAgICAgICBza2lsbHM6ICAgICAwLFxyXG4gICAgICAgICAgICBwb3NpdGlvbnM6ICAwLFxyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIHZhciBpbWdMb2FkSW50ZXJ2YWwsIHRhZ0xvYWRJbnRlcnZhbCwgYWR2TG9hZEludGVydmFsO1xyXG5cclxuICAgICAgICAkc2NvcGUuJG9uKCdQUk9GSUxFJywgZnVuY3Rpb24oZXZlbnQsIGRhdGEpIHtcclxuICAgICAgICAgICAgLy8kc2NvcGUuJGFwcGx5KGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgICAgICAgJHNjb3BlLmxvYWRQZXJjZW50YWdlLmxpbmtlZEluID0gMTAwO1xyXG4gICAgICAgICAgICAgICAgJHNjb3BlLmNvbXBsZXRlU2VjdGlvbigwKTtcclxuXHJcbiAgICAgICAgICAgICAgICAkc2NvcGUucHJvZmlsZSA9IFRhZ1NlcnZpY2UucHJvZmlsZTsgICBcclxuICAgICAgICAgICAgICAgICRzY29wZS5zdW1tYXJ5ID0gVGFnU2VydmljZS5wcm9maWxlLnN1bW1hcnk7ICBcclxuICAgICAgICAgICAgICAgICRzY29wZS5lZHVjYXRpb25zID0gVGFnU2VydmljZS5lZHVjYXRpb25zOyAgIFxyXG4gICAgICAgICAgICAgICAgJHNjb3BlLnNraWxscyA9IFRhZ1NlcnZpY2Uuc2tpbGxzO1xyXG4gICAgICAgICAgICAgICAgJHNjb3BlLnBvc2l0aW9ucyA9IFRhZ1NlcnZpY2UucG9zaXRpb25zOyAgICBcclxuICAgICAgICAgICAvLyB9KTtcclxuICAgIH0pO1xyXG5cclxuICAgICAgICAkc2NvcGUuJG9uKCdQUk9GSUxFX0FMTCcsIGZ1bmN0aW9uKGV2ZW50LCBkYXRhKSB7XHJcbiAgICAgICAgICAgICRzY29wZS5saW5rZWRJbkxvYWRQZXJjZW50YWdlID0gMTAwO1xyXG4gICAgICAgICAgICAkc2NvcGUuY29tcGxldGVTZWN0aW9uKDApO1xyXG4gICAgICAgICAgICAvLyRzY29wZS4kYXBwbHkoKTtcclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgJHNjb3BlLmZpbmRTY2hvb2xMb2dvVXJsRnJvbUNvbXBheSA9IGZ1bmN0aW9uKHNjaG9vbE5hbWUpIHtcclxuICAgICAgICAgICAgdmFyIGNvbXBhbnlVcmxNYXAgPSBUYWdTZXJ2aWNlLmNvbXBhbnlVcmxNYXA7XHJcbiAgICAgICAgICAgIGZvciAoa2V5IGluIGNvbXBhbnlVcmxNYXApIHtcclxuICAgICAgICAgICAgICAgIHZhciBjb21wYW55ID0gY29tcGFueVVybE1hcFtrZXldO1xyXG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ2xvb2sgZm9yOiAnLCBjb21wYW55VXJsTWFwW2tleV0pO1xyXG4gICAgICAgICAgICAgICAgaWYoY29tcGFueS5uYW1lICYmIGNvbXBhbnkubG9nb1VybCAmJiBjb21wYW55Lm5hbWUgPT09IHNjaG9vbE5hbWUpIHtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gY29tcGFueS5sb2dvVXJsO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgICRzY29wZS5kaXNwbGF5U2VjdGlvbkNvbnRlbnQgPSBmdW5jdGlvbihzZWN0aW9uLCBjb250ZW50UHJvcGVydHkpIHtcclxuICAgICAgICAgICAgJHNjb3BlLmxvYWRQZXJjZW50YWdlW2NvbnRlbnRQcm9wZXJ0eV0gPSAwO1xyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgaWYoJHNjb3BlW2NvbnRlbnRQcm9wZXJ0eV0pIHtcclxuICAgICAgICAgICAgICAgICRzY29wZS5sb2FkUGVyY2VudGFnZVtjb250ZW50UHJvcGVydHldID0gMTAwO1xyXG4gICAgICAgICAgICAgICAgJHNjb3BlLmNvbXBsZXRlU2VjdGlvbihzZWN0aW9uKTtcclxuICAgICAgICAgICAgICAgIC8vICRzY29wZS4kYXBwbHkoKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgJHNjb3BlLm1heFZhbHVlID0gZnVuY3Rpb24odGFncykge1xyXG4gICAgICAgICAgICBpZih0YWdzLmxlbmd0aCAmJiB0YWdzLmxlbmd0aCA+IDApIHtcclxuICAgICAgICAgICAgICAgIHZhciBtYXggPSAtOTk5O1xyXG4gICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDAsIGxlbiA9IHRhZ3MubGVuZ3RoOyBpIDwgbGVuOyBpKyspIHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAodGFnc1tpXS52YWx1ZSA+IG1heCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBtYXggPSB0YWdzW2ldLnZhbHVlO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIHJldHVybiBtYXg7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgcmV0dXJuIDEwMDtcclxuICAgICAgICB9XHJcbiAgICAgICAgXHJcbiAgICAgICAgJHNjb3BlLnR3aW5rbGVTdHlsZSA9IGZ1bmN0aW9uKHZhbHVlLCBsb2FkUGVyY2VudGFnZSkge1xyXG4gICAgICAgICAgICB2YXIgdHJhbnNpdGlvblN0cmluZyA9ICd0b3AgMC40cyBlYXNlICcgKyAgKHZhbHVlICogMykudG9GaXhlZCgyKSArICdzJyArICcsJyArICdvcGFjaXR5IDAuNHMgZWFzZSAnICsgIHZhbHVlICogMyArICdzJyArICc7JzsvLyArICcsJyArICd0cmFuc2Zvcm0gMC40cyBlYXNlICcgKyAnOyc7XHJcbiAgICAgICAgICAgIHZhciBhbmltYXRpb25EZWxheVN0cmluZyA9ICgxMCArIHZhbHVlICogNikgKyAncycgKyAnOyc7IFxyXG4gICAgICAgICAgICB2YXIgc3R5bGVTdHJpbmcgPSAnZm9udC1zaXplOiAnICsgKDE2ICsgdmFsdWUgKiAxMikgKyAncHgnICsgJzsnICtcclxuICAgICAgICAgICAgJ2xpbmUtaGVpZ2h0OiAnICsgJzEuNScgKyAnOycgK1xyXG4gICAgICAgICAgICAvKid0b3A6ICcgKyAobG9hZFBlcmNlbnRhZ2UgPT09IDEwMCkgJiYgJzAnIHx8ICcxMHB4JyArICc7JyArKi9cclxuICAgICAgICAgICAgJy13ZWJraXQtdHJhbnNpdGlvbjogJyArIHRyYW5zaXRpb25TdHJpbmcgK1xyXG4gICAgICAgICAgICAnLW1vei10cmFuc2l0aW9uOiAnICsgdHJhbnNpdGlvblN0cmluZyArXHJcbiAgICAgICAgICAgICd0cmFuc2l0aW9uOiAnICsgdHJhbnNpdGlvblN0cmluZyArXHJcbiAgICAgICAgICAgICctd2Via2l0LWFuaW1hdGlvbi1kZWxheTogJyArIGFuaW1hdGlvbkRlbGF5U3RyaW5nICtcclxuICAgICAgICAgICAgJy1tb3otYW5pbWF0aW9uLWRlbGF5OiAnICsgYW5pbWF0aW9uRGVsYXlTdHJpbmcgK1xyXG4gICAgICAgICAgICAnYW5pbWF0aW9uLWRlbGF5OiAnICsgYW5pbWF0aW9uRGVsYXlTdHJpbmc7XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gc3R5bGVTdHJpbmc7XHJcblxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gJHNjb3BlLnRhZ0Jhc2VIZWlnaHQgPSBmdW5jdGlvbih2YWx1ZSkge1xyXG4gICAgICAgIC8vICAgICByZXR1cm4gTWF0aC5taW4oMjgsIDggKyB2YWx1ZSAqIDMyKTtcclxuICAgICAgICAvLyB9XHJcblxyXG4gICAgICAgICRzY29wZS5jb21wbGV0ZVNlY3Rpb24gPSBmdW5jdGlvbihzdGVwKSB7XHJcbiAgICAgICAgICAgICRzY29wZS5jb21wbGV0ZWRTZWN0aW9uID0gc3RlcDtcclxuICAgICAgICB9XHJcblxyXG5cclxuICAgICAgICAkc2NvcGUuc2Nyb2xsVG9TZWN0aW9uID0gZnVuY3Rpb24oc3RlcCkge1xyXG4gICAgICAgICAgICAvLyQoJyNzdGVwJyArIHN0ZXApLmhlaWdodCh3aW5kb3cuaW5uZXJIZWlnaHQpO1xyXG4gICAgICAgICAgICAkKCdodG1sLGJvZHknKS5hbmltYXRlKHtcclxuICAgICAgICAgICAgICAgIHNjcm9sbFRvcDogJCgnI3N0ZXAnICsgc3RlcCkub2Zmc2V0KCkudG9wXHJcbiAgICAgICAgICAgIH0sIDQwMCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAkc2NvcGUudmlzaWJsZSA9IGZ1bmN0aW9uKGlkZW50aWZpZXIpIHtcclxuICAgICAgICAgICAgaWYgKGlkZW50aWZpZXIgPT09ICdsaW5rZWRJbicpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiAgJHNjb3BlLmxvYWRQZXJjZW50YWdlW2lkZW50aWZpZXJdID4gMDtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gJHNjb3BlLmxvYWRQZXJjZW50YWdlW2lkZW50aWZpZXJdID09PSAxMDA7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG5cclxuICAgIH1dKTtcclxuXHJcblxyXG4iLCJhcHBNb2R1bGUuc2VydmljZSgnVGFnU2VydmljZScsIFsnJGh0dHAnLCAnJHJvb3RTY29wZScsICckcScsIGZ1bmN0aW9uICgkaHR0cCwgJHJvb3RTY29wZSwgJHEpIHtcclxuICAgIFxyXG4gICAgdmFyIHRoYXQgPSB0aGlzO1xyXG5cclxuICAgIC8vIHRoaXMuU0hBT1BFTkdfTElOS0lFRElOX0lEID0gJ3FDNzJmbUpHbEInO1xyXG5cclxuICAgIHRoaXMuY29tcGFueVVybE1hcCA9IHt9O1xyXG4gICAgdGhpcy5jb21wYW55VXJsTWFwWzEwNDNdID0gIHtpZDogMTA0MywgbG9nb1VybDogXCJodHRwczovL21lZGlhLmxpY2RuLmNvbS9tcHIvbXByL3AvMy8wMDUvMDdiLzAwYS8wNWRlZjQyLnBuZ1wiLCBuYW1lOiBcIlNpZW1lbnNcIn07XHJcbiAgICB0aGlzLmNvbXBhbnlVcmxNYXBbNTA3NzIwXSA9IHtpZDogNTA3NzIwLCBsb2dvVXJsOiBcImh0dHBzOi8vbWVkaWEubGljZG4uY29tL21wci9tcHIvcC8zLzAwMC8wMzIvMTRjLzBmYWQ2MzgucG5nXCIsIG5hbWU6IFwiQmVpamluZyBKaWFvdG9uZyBVbml2ZXJzaXR5XCJ9IDtcclxuICAgIHRoaXMuY29tcGFueVVybE1hcFszNDYxXSA9IHtpZDogMzQ2MSwgbG9nb1VybDogXCJodHRwczovL21lZGlhLmxpY2RuLmNvbS9tcHIvbXByL3AvNy8wMDAvMmI1LzFiMy8zN2FlZWZlLnBuZ1wiLCBuYW1lOiBcIlVuaXZlcnNpdHkgb2YgUGl0dHNidXJnaFwifTtcclxuICAgIFxyXG4gICAgdGhpcy5nZXRUYWdzID0gZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgdmFyIHByb21pc2UgPSAkaHR0cC5nZXQoJ2FwaS90YWdzLmpzb24nKS50aGVuKGZ1bmN0aW9uKHJlc3BvbnNlKSB7XHJcbiAgICAgICAgICAgIHJldHVybiByZXNwb25zZS5kYXRhO1xyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIHJldHVybiBwcm9taXNlO1xyXG4gICAgfVxyXG5cclxuICAgIHRoaXMuZ2V0U3RhdGljQWR2cyA9IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIHZhciBwcm9taXNlID0gJGh0dHAuZ2V0KCdhcGkvYWR2cy5qc29uJykudGhlbihmdW5jdGlvbihyZXNwb25zZSkge1xyXG4gICAgICAgICAgICByZXR1cm4gcmVzcG9uc2UuZGF0YTtcclxuICAgICAgICB9KTtcclxuICAgICAgICByZXR1cm4gcHJvbWlzZTtcclxuICAgIH1cclxuXHJcbiAgICB0aGlzLmxvYWRQcm9maWxlID0gZnVuY3Rpb24oSU5Qcm9maWxlKSB7XHJcbiAgICAgICAgaWYoSU5Qcm9maWxlKSB7XHJcbiAgICAgICAgICAgIHRoYXQucHJvZmlsZSA9IElOUHJvZmlsZTtcclxuICAgICAgICAgICAgdGhhdC5wb3NpdGlvbnMgPSBncm91cFBvc2l0aW9uQnlZZWFyKElOUHJvZmlsZS5wb3NpdGlvbnMpOyAgXHJcblxyXG4gICAgICAgICAgICB0aGF0LnNraWxscyA9IGZsYXR0ZW5Ta2lsbHMoSU5Qcm9maWxlLnNraWxscyk7XHJcbiAgICAgICAgICAgIHRoYXQuZWR1Y2F0aW9ucyA9IElOUHJvZmlsZS5lZHVjYXRpb25zLnZhbHVlcztcclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKHRoYXQucHJvZmlsZSk7XHJcbiAgICAgICAgICAgIGdldENvbXBhbnlMb2dvcyhJTlByb2ZpbGUucG9zaXRpb25zKS50aGVuKGZ1bmN0aW9uKHJlc3VsdCl7XHJcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhyZXN1bHQpO1xyXG4gICAgICAgICAgICAgICAgdGhhdC5wb3NpdGlvbnMgPSBncm91cFBvc2l0aW9uQnlZZWFyKHJlc3VsdCk7XHJcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyh0aGF0LnBvc2l0aW9ucyk7XHJcbiAgICAgICAgICAgICAgICAvLyAkcm9vdFNjb3BlLiRicm9hZGNhc3QoJ1BST0ZJTEVfQUxMJywgbnVsbCk7XHJcbiAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAgICAgJHJvb3RTY29wZS4kYnJvYWRjYXN0KCdQUk9GSUxFJywgbnVsbCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2UgaWYoSU5Qcm9maWxlID09PSBudWxsKSB7XHJcbiAgICAgICAgICAgICRodHRwLmdldCgnYXBpL3NoYW9wZW5nX2xpbmtlZGluX3Byb2ZpbGUuanNvbicpLnN1Y2Nlc3MoZnVuY3Rpb24oZGF0YSl7XHJcbiAgICAgICAgICAgICAgICB2YXIgSU5Qcm9maWxlID0gZGF0YTtcclxuICAgICAgICAgICAgICAgIHRoYXQucHJvZmlsZSA9IElOUHJvZmlsZTtcclxuICAgICAgICAgICAgICAgIHRoYXQucG9zaXRpb25zID0gZ3JvdXBQb3NpdGlvbkJ5WWVhcihJTlByb2ZpbGUucG9zaXRpb25zKTsgIFxyXG5cclxuICAgICAgICAgICAgICAgIHRoYXQuc2tpbGxzID0gZmxhdHRlblNraWxscyhJTlByb2ZpbGUuc2tpbGxzKTtcclxuICAgICAgICAgICAgICAgIHRoYXQuZWR1Y2F0aW9ucyA9IElOUHJvZmlsZS5lZHVjYXRpb25zLnZhbHVlcztcclxuICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2codGhhdC5wcm9maWxlKTtcclxuICAgICAgICAgICAgICAgIHRoYXQucG9zaXRpb25zID0gZ2V0U3RhdGljQ29tcGFueUxvZ29zKElOUHJvZmlsZS5wb3NpdGlvbnMpO1xyXG4gICAgICAgICAgICAgICAgdGhhdC5wb3NpdGlvbnMgPSBncm91cFBvc2l0aW9uQnlZZWFyKHRoYXQucG9zaXRpb25zKTtcclxuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKHRoYXQucG9zaXRpb25zKTtcclxuICAgICAgICAgICAgICAgICRyb290U2NvcGUuJGJyb2FkY2FzdCgnUFJPRklMRScsIG51bGwpO1xyXG5cclxuICAgICAgICAgICAgICAgIC8vICRyb290U2NvcGUuJGJyb2FkY2FzdCgnUFJPRklMRScsIG51bGwpO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9XHJcbiAgICAgICAgXHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gZmxhdHRlblNraWxscyhJTlNraWxscykge1xyXG4gICAgICAgIHZhciBza2lsbHMgPSBJTlNraWxscy52YWx1ZXMgfHwgW107XHJcbiAgICAgICAgdmFyIGEgPSBbXTtcclxuXHJcbiAgICAgICAgaWYoYW5ndWxhci5pc0FycmF5KHNraWxscykpe1xyXG4gICAgICAgICAgICBza2lsbHMuZm9yRWFjaChmdW5jdGlvbihlbGVtZW50LCBpbmRleCwgYXJyYXkpIHtcclxuICAgICAgICAgICAgICAgIGlmKGVsZW1lbnQuc2tpbGwpIHtcclxuICAgICAgICAgICAgICAgICAgICBhLnB1c2goe25hbWU6IGVsZW1lbnQuc2tpbGwubmFtZSwgdmFsdWU6IE1hdGgucmFuZG9tKCl9KTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gYTtcclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiBnZXRTdGF0aWNDb21wYW55TG9nb3MoSU5Qb3NpdGlvbnMpIHtcclxuICAgICAgICBpZihJTlBvc2l0aW9ucy52YWx1ZXMgJiYgYW5ndWxhci5pc0FycmF5KElOUG9zaXRpb25zLnZhbHVlcykpIHtcclxuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBJTlBvc2l0aW9ucy52YWx1ZXMubGVuZ3RoOyBpKysgKSB7XHJcbiAgICAgICAgICAgICAgICBJTlBvc2l0aW9ucy52YWx1ZXNbaV0ubG9nb1VybCA9IHRoYXQuY29tcGFueVVybE1hcFtJTlBvc2l0aW9ucy52YWx1ZXNbaV0uaWRdO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBJTlBvc2l0aW9ucztcclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiBhc3luY0xvZ29VcmwoaWQpIHtcclxuICAgICAgICB2YXIgZGVmZXJyZWQgPSAkcS5kZWZlcigpO1xyXG5cclxuICAgICAgICBpZih0aGF0LmNvbXBhbnlVcmxNYXBbaWRdKSB7XHJcbiAgICAgICAgICAgIHZhciByZXN1bHRzID0gdGhhdC5jb21wYW55VXJsTWFwW2lkXTtcclxuICAgICAgICAgICAgZGVmZXJyZWQucmVzb2x2ZShyZXN1bHRzKTtcclxuICAgICAgICAgICAgY29uc29sZS5sb2coJ1lheSEgU2F2ZWQgb25lIEFQSSBjYWxsLCBmb3VuZCBjb21wYW55IG9iamVjdCBpbiBjYWNoZTogJywgcmVzdWx0cyk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICBJTi5BUEkuUmF3KCcvY29tcGFuaWVzL2lkPScgKyBpZCArICc6KGlkLG5hbWUsbG9nby11cmwpJylcclxuICAgICAgICAgICAgLnJlc3VsdChmdW5jdGlvbihyZXN1bHRzKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAocmVzdWx0cy5sb2dvVXJsKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgLy8gcG9zaXRpb24ubG9nb1VybCA9IHJlc3VsdHMubG9nb1VybDtcclxuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnYXN5bmNMb2dvVXJsJywgcmVzdWx0cyk7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5jb21wYW55VXJsTWFwW2lkXSA9IHJlc3VsdHM7XHJcbiAgICAgICAgICAgICAgICAgICAgZGVmZXJyZWQucmVzb2x2ZShyZXN1bHRzKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgIGRlZmVycmVkLnJlamVjdChyZXN1bHRzKTsgICAgXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgfSlcclxuICAgICAgICAgICAgLmVycm9yKGZ1bmN0aW9uKGVycm9yKXtcclxuICAgICAgICAgICAgICAgIC8vaW4gY2FzZSBvZiBuZXR3b3JrIGVycm9yLCB0aHJvdHRsZSwgZXRjLlxyXG4gICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcignYXN5bmNMb2dvVXJsIGVycm9yOiAnLCBhbmd1bGFyLnRvSnNvbihlcnJvciwgdHJ1ZSkpXHJcbiAgICAgICAgICAgICAgICBkZWZlcnJlZC5yZWplY3QoZXJyb3IpO1xyXG4gICAgICAgICAgICB9KTsgICAgICAgICAgICBcclxuICAgICAgICB9XHJcblxyXG5cclxuICAgICAgICByZXR1cm4gZGVmZXJyZWQucHJvbWlzZTtcclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiBnZXRDb21wYW55TG9nb3MoSU5Qb3NpdGlvbnMpIHtcclxuICAgICAgICB2YXIgZGVmZXJyZWQgPSAkcS5kZWZlcigpO1xyXG5cclxuICAgICAgICB2YXIgcG9zaXRpb25zID0gSU5Qb3NpdGlvbnMudmFsdWVzIHx8IFtdO1xyXG4gICAgICAgIHZhciBiID0gW107XHJcbiAgICAgICAgcG9zaXRpb25zLmZvckVhY2goZnVuY3Rpb24ocG9zaXRpb24sIGluZGV4LCBhcnJheSkge1xyXG4gICAgICAgICAgICBpZihwb3NpdGlvbi5jb21wYW55ICYmIHBvc2l0aW9uLmNvbXBhbnkuaWQpIHtcclxuICAgICAgICAgICAgICAgIHZhciBwcm9taXNlID0gYXN5bmNMb2dvVXJsKHBvc2l0aW9uLmNvbXBhbnkuaWQpO1xyXG4gICAgICAgICAgICAgICAgdmFyIG5ld1Byb21pc2UgPSBwcm9taXNlLnRoZW4oZnVuY3Rpb24oc3VjY2Vzcykge1xyXG4gICAgICAgICAgICAgICAgICAgIHBvc2l0aW9uLmxvZ29VcmwgPSBzdWNjZXNzLmxvZ29Vcmw7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHBvc2l0aW9uO1xyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICBiLnB1c2gobmV3UHJvbWlzZSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgJHEuYWxsKGIpLnRoZW4oZnVuY3Rpb24ocmVzdWx0KSB7XHJcbiAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKCctLS1hbGwtLS0nLCByZXN1bHQpO1xyXG4gICAgICAgICAgICAvLyBjb25zb2xlLmxvZygnLS0tYWxsLS0tJywgYW5ndWxhci50b0pzb24ocmVzdWx0LCB0cnVlKSk7XHJcbiAgICAgICAgICAgIGRlZmVycmVkLnJlc29sdmUocmVzdWx0KTtcclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgcmV0dXJuIGRlZmVycmVkLnByb21pc2U7XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gZ3JvdXBQb3NpdGlvbkJ5WWVhcihwb3NpdGlvbnNBcnJheSkge1xyXG4gICAgICAgIHZhciBwb3NpdGlvbnMgPSBbXTtcclxuXHJcbiAgICAgICAgaWYoYW5ndWxhci5pc0FycmF5KHBvc2l0aW9uc0FycmF5KSkge1xyXG4gICAgICAgICAgICBwb3NpdGlvbnMgPSBwb3NpdGlvbnNBcnJheTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSBpZihwb3NpdGlvbnNBcnJheS52YWx1ZXMgJiYgYW5ndWxhci5pc0FycmF5KHBvc2l0aW9uc0FycmF5LnZhbHVlcykpIHtcclxuICAgICAgICAgICAgcG9zaXRpb25zID0gcG9zaXRpb25zQXJyYXkudmFsdWVzO1xyXG4gICAgICAgIH1cclxuICAgICAgICBcclxuICAgICAgICB2YXIgYSA9IFtdO1xyXG5cclxuICAgICAgICBpZihhbmd1bGFyLmlzQXJyYXkocG9zaXRpb25zKSkge1xyXG5cclxuICAgICAgICAgICAgdmFyIGV2ZW4gPSAwO1xyXG4gICAgICAgICAgICBwb3NpdGlvbnMuZm9yRWFjaChmdW5jdGlvbihwb3NpdGlvbiwgaW5kZXgsIGFycmF5KSB7XHJcblxyXG5cclxuICAgICAgICAgICAgICAgIGlmIChhLmxlbmd0aCA9PT0gMCkge1xyXG4gICAgICAgICAgICAgICAgICAgIC8vcHVzaCB0aGlzIHllYXIgZmlyc3RcclxuICAgICAgICAgICAgICAgICAgICBpZihwb3NpdGlvbi5zdGFydERhdGUueWVhciAhPT0gbmV3IERhdGUoKS5nZXRGdWxsWWVhcigpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGEucHVzaCh7bWFyazogbmV3IERhdGUoKS5nZXRGdWxsWWVhcigpfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIC8vb24gdGhlIGZpcnN0IHBvc2l0aW9uLCBwdXNoIGEgeWVhciBtYXJrIGZpcnN0XHJcbiAgICAgICAgICAgICAgICAgICAgYS5wdXNoKHttYXJrOiBwb3NpdGlvbi5zdGFydERhdGUueWVhcn0pO1xyXG4gICAgICAgICAgICAgICAgICAgIHBvc2l0aW9uLmV2ZW4gPSBldmVuO1xyXG4gICAgICAgICAgICAgICAgICAgIGEucHVzaChwb3NpdGlvbik7XHJcbiAgICAgICAgICAgICAgICAgICAgZXZlbiA9IDEgLSBldmVuO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgLy9zZWNvbmQgb25lIGFuZCBvbiwgY29tcGFyZSB3aXRoIHRoZSBwcmV2aW91cyBvbmUsICAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgICAgICB2YXIgbGFzdFBvc2l0aW9uID0gYVthLmxlbmd0aCAtIDFdO1xyXG4gICAgICAgICAgICAgICAgICAgIC8vaWYgaXQgc3RhcnRzIGluIHRoZSBuZXcgeWVhciwgdGhlbiBwdXNoIGEgeWVhciBtYXJrIGZpcnN0XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKGxhc3RQb3NpdGlvbi5zdGFydERhdGUueWVhciAhPT0gcG9zaXRpb24uc3RhcnREYXRlLnllYXIpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgYS5wdXNoKHttYXJrOiBwb3NpdGlvbi5zdGFydERhdGUueWVhcn0pO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAvL2lmIGl0IGlzIGluIHRoZSBzYW1lIHllYXIsIGp1c3QgcHVzaCB0aGUgcG9zaXRpb25cclxuICAgICAgICAgICAgICAgICAgICBwb3NpdGlvbi5ldmVuID0gZXZlbjtcclxuICAgICAgICAgICAgICAgICAgICBhLnB1c2gocG9zaXRpb24pO1xyXG4gICAgICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgICAgICAgIGV2ZW4gPSAxIC0gZXZlbjtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSk7XHJcbn1cclxucmV0dXJuIGE7XHJcbn1cclxuXHJcbn1dKTsiLCJcclxuXHJcbmFwcE1vZHVsZS5kaXJlY3RpdmUoJ2xvYWRQcm9ncmVzc0ljb24nLCBbZnVuY3Rpb24gKCkge1xyXG4gICAgcmV0dXJuIHtcclxuICAgICAgICByZXN0cmljdDogJ0EnLFxyXG4gICAgICAgIHJlcGxhY2U6IHRydWUsXHJcbiAgICAgICAgc2NvcGU6IHtcclxuICAgICAgICAgICAgaWNvbmNsYXNzOiAnQCcsIFxyXG4gICAgICAgICAgICBwcm9ncmVzczogJ0AnLCBcclxuICAgICAgICAgICAgcmV2ZXJzZTogJ0AnXHJcbiAgICAgICAgfSxcclxuICAgICAgICB0ZW1wbGF0ZTogJzxkaXYgY2xhc3M9XCJnbHlwaC1wcm9ncmVzc1wiIG5nLWNsYXNzPVwie1xcJ3JldmVyc2VcXCc6IHJldmVyc2V9XCI+IFxcXHJcbiAgICAgICAgPGRpdiBjbGFzcz1cIiB2aWV3LXBvcnRcIiBuZy1jbGFzcz1cIntcXCdmZ1xcJzogcmV2ZXJzZSwgXFwnYmdcXCc6ICFyZXZlcnNlfVwiPjxzcGFuIGNsYXNzPVwie3tpY29uY2xhc3N9fVwiPjwvc3Bhbj48L2Rpdj4gICAgXFxcclxuICAgICAgICA8ZGl2IGNsYXNzPVwiIHZpZXctcG9ydFwiIG5nLWNsYXNzPVwie1xcJ2JnXFwnOiByZXZlcnNlLCBcXCdmZ1xcJzogIXJldmVyc2V9XCI+PHNwYW4gY2xhc3M9XCJ7e2ljb25jbGFzc319XCI+PC9zcGFuPjwvZGl2PiAgIFxcXHJcbiAgICAgICAgPC9kaXY+JyxcclxuICAgICAgICBsaW5rOiBmdW5jdGlvbiAoc2NvcGUsIGVsZW1lbnQsIGF0dHJzKSB7XHJcbiAgICAgICAgICAgIHNjb3BlLiR3YXRjaCgncHJvZ3Jlc3MnLCBmdW5jdGlvbihuZXdWYWx1ZSwgb2xkVmFsdWUpIHtcclxuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCdsb2FkUHJvZ3Jlc3NJY29uLnByb2dyZXNzID0gJywgbmV3VmFsdWUsIG9sZFZhbHVlKTtcclxuICAgICAgICAgICAgICAgIGlmKHBhcnNlSW50KG5ld1ZhbHVlKSA9PT0gMTAwKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpe1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBlbGVtZW50LmFkZENsYXNzKCdsb2FkZWQnKTtcclxuICAgICAgICAgICAgICAgICAgICB9LDEwMClcclxuICAgICAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGVsc2UgaWYocGFyc2VJbnQobmV3VmFsdWUpID09PSAwKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpe1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBlbGVtZW50LnJlbW92ZUNsYXNzKCdsb2FkZWQnKTtcclxuICAgICAgICAgICAgICAgICAgICB9LCAxMDApO1xyXG4gICAgICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9KVxyXG4gICAgICAgIH1cclxuICAgIH07XHJcbn1dKTtcclxuXHJcbiAvKnRlbXBsYXRlOiAnPGRpdiBjbGFzcz1cImdseXBoLXByb2dyZXNzXCI+IFxcXHJcbiAgICAgICAgPGRpdiBjbGFzcz1cIiB2aWV3LXBvcnRcIiBuZy1jbGFzcz1cIntcXCdmZ1xcJzogcmV2ZXJzZSwgXFwnYmdcXCc6ICFyZXZlcnNlfVwiPjxzcGFuIGNsYXNzPVwie3tpY29uY2xhc3N9fVwiPjwvc3Bhbj48L2Rpdj4gICAgXFxcclxuICAgICAgICA8ZGl2IGNsYXNzPVwiIHZpZXctcG9ydFwiIG5nLWNsYXNzPVwie1xcJ2JnXFwnOiByZXZlcnNlLCBcXCdmZ1xcJzogIXJldmVyc2V9XCIgc3R5bGU9XCJoZWlnaHQ6IHt7cmV2ZXJzZSAmJiBwcm9ncmVzcyB8fCAoMTAwIC0gcHJvZ3Jlc3MpfX0lXCI+PHNwYW4gY2xhc3M9XCJ7e2ljb25jbGFzc319XCI+PC9zcGFuPjwvZGl2PiAgIFxcXHJcbiAgICAgICAgPC9kaXY+JywqL1xyXG5cclxuXHJcbmFwcE1vZHVsZS5maWx0ZXIoJ2ludFRvTW9udGgnLCBmdW5jdGlvbigpe1xyXG4gICAgcmV0dXJuIGZ1bmN0aW9uKGlucHV0KSB7XHJcbiAgICAgICAgdmFyIG1hcCA9IFsnSmFuJywgJ0ZlYicsICdNYXInLCAnQXByJywgJ01heScsICdKdW4nLCAnSnVsJywgJ0F1ZycsICdTZXAnLCAnT2N0JywgJ05vdicsICdEZWMnXTtcclxuICAgICAgICBpbnB1dCA9IHBhcnNlSW50KGlucHV0KTtcclxuICAgICAgICBpZiAoaW5wdXQgPiAwICYmIGlucHV0IDwgMTMpIHtcclxuICAgICAgICAgICAgcmV0dXJuIG1hcFtpbnB1dCAtIDFdO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gJyc7XHJcbiAgICB9XHJcbn0pO1xyXG5cclxuYXBwTW9kdWxlLmZpbHRlcignZm9ySG93TG9uZycsIGZ1bmN0aW9uKCl7XHJcbiAgICByZXR1cm4gZnVuY3Rpb24ocG9zaXRpb24pIHtcclxuICAgICAgICBpZiAocG9zaXRpb24uaXNDdXJyZW50KSB7XHJcbiAgICAgICAgICAgIC8vIHJldHVybiAndGlsbCBub3cnXHJcbiAgICAgICAgICAgIHZhciBub3cgPSBuZXcgRGF0ZSgpO1xyXG5cclxuICAgICAgICAgICAgcG9zaXRpb24uZW5kRGF0ZSA9IHtcclxuICAgICAgICAgICAgICAgIHllYXI6IG5vdy5nZXRGdWxsWWVhcigpLFxyXG4gICAgICAgICAgICAgICAgbW9udGg6IG5vdy5nZXRNb250aCgpICsgMVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIFxyXG4gICAgICAgIGlmIChwb3NpdGlvbi5zdGFydERhdGUgJiYgcG9zaXRpb24uZW5kRGF0ZSkge1xyXG4gICAgICAgICAgICB2YXIgeWVhckxvbmcgPSBwb3NpdGlvbi5lbmREYXRlLnllYXIgLSBwb3NpdGlvbi5zdGFydERhdGUueWVhcixcclxuICAgICAgICAgICAgbW9udGhMb25nID0gcG9zaXRpb24uZW5kRGF0ZS5tb250aCAtIHBvc2l0aW9uLnN0YXJ0RGF0ZS5tb250aDtcclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIGlmIChtb250aExvbmcgPCAwKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgdG90YWxMb25nSW5Nb250aCA9IHllYXJMb25nICogMTIgKyBtb250aExvbmc7XHJcbiAgICAgICAgICAgICAgICB5ZWFyTG9uZyA9IE1hdGguZmxvb3IodG90YWxMb25nSW5Nb250aCAvIDEyKTtcclxuICAgICAgICAgICAgICAgIG1vbnRoTG9uZyA9IDEyICsgbW9udGhMb25nO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICB2YXIgeWVhclVuaXQgPSB5ZWFyTG9uZyA+IDEgPyAneWVhcnMnIDogJ3llYXInLFxyXG4gICAgICAgICAgICBtb250aFVuaXQgPSBtb250aExvbmcgPiAxID8gJ21vbnRocycgOiAnbW9udGgnO1xyXG5cclxuICAgICAgICAgICAgdmFyIHllYXJTdHJpbmcgPSB5ZWFyTG9uZyA+IDAgPyB5ZWFyTG9uZyArICcgJyArIHllYXJVbml0ICsgJyAnIDogJycsXHJcbiAgICAgICAgICAgIG1vbnRoU3RyaW5nID0gbW9udGhMb25nID4gMD8gbW9udGhMb25nICsgJyAnICsgbW9udGhVbml0IDogJyc7XHJcblxyXG4gICAgICAgICAgICB2YXIgd2hvbGVTdHJpbmcgPSB5ZWFyU3RyaW5nICsgbW9udGhTdHJpbmcgKyAocG9zaXRpb24uaXNDdXJyZW50ID8gJyB0aWxsIG5vdycgOiAnJyk7XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gd2hvbGVTdHJpbmc7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gJyc7XHJcbiAgICB9XHJcbn0pO1xyXG5cclxuYXBwTW9kdWxlLmRpcmVjdGl2ZSgnYnJlYWtBdE4nLCBbZnVuY3Rpb24gKCkge1xyXG4gICAgcmV0dXJuIHtcclxuICAgICAgICByZXN0cmljdDogJ0EnLFxyXG4gICAgICAgIHJlcGxhY2U6IHRydWUsXHJcbiAgICAgICAgc2NvcGU6IHtcclxuICAgICAgICAgICAgY29udGVudDogJ0AnXHJcbiAgICAgICAgfSxcclxuICAgICAgICBsaW5rOiBmdW5jdGlvbiAoc2NvcGUsIGVsZW1lbnQsIGF0dHJzKSB7XHJcblxyXG4gICAgICAgICAgICAvL2xpbmtlZGluIEFQSSB3aWxsIHJlbW92ZSBsaW5lIGJyZWFrcywgaGVyZSB3ZSBhZGQgdGhlbSBiYWNrIGluIGJlZm9yZSBcIi4uLihuKVwiIHdoZXJlIG4gPiAxXHJcbiAgICAgICAgICAgIGF0dHJzLiRvYnNlcnZlKCdjb250ZW50JywgZnVuY3Rpb24odmFsdWUpe1xyXG4gICAgICAgICAgICAgICAgLy8gdmFyIGh0bWxTdHJpbmcgPSB2YWx1ZS5yZXBsYWNlKC9cXHMrXFwoXFxkKlxcKS9nLCBmdW5jdGlvbih2KSB7XHJcbiAgICAgICAgICAgICAgICAvLyAgICAgcmV0dXJuICcgPGJyPicgKyB2O1xyXG4gICAgICAgICAgICAgICAgLy8gfSk7XHJcbiAgICAgICAgICAgIHZhciBodG1sU3RyaW5nID0gdmFsdWUucmVwbGFjZSgvXFxuL2csIGZ1bmN0aW9uKHYpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiAnIDxicj4nO1xyXG4gICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICAgIGVsZW1lbnQuaHRtbChodG1sU3RyaW5nKTtcclxuICAgICAgICAgICAgZWxlbWVudC5hcHBlbmQoJzxkaXYgY2xhc3M9XCJtYXNrXCI+PC9kaXY+Jyk7XHJcbiAgICAgICAgfSk7ICAgICBcclxuXHJcbiAgICAgICAgfVxyXG4gICAgfTtcclxufV0pO1xyXG5cclxuYXBwTW9kdWxlLmRpcmVjdGl2ZSgnY2xpY2tBZGRDbGFzcycsIFtmdW5jdGlvbiAoKSB7XHJcbiAgICByZXR1cm4ge1xyXG4gICAgICAgIHJlc3RyaWN0OiAnQScsXHJcbiAgICAgICAgc2NvcGU6IHtcclxuICAgICAgICAgICAgdG9nZ2xlY2xhc3M6ICdAJ1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgbGluazogZnVuY3Rpb24gKHNjb3BlLCBlbGVtZW50LCBhdHRycykge1xyXG4gICAgICAgICAgICBlbGVtZW50Lm9uKCdjbGljaycsIGZ1bmN0aW9uKGUpe1xyXG4gICAgICAgICAgICAgICAgZWxlbWVudC5hZGRDbGFzcygnZXhwYW5kZWQnKTtcclxuICAgICAgICAgICAgfSlcclxuICAgICAgICB9XHJcbiAgICB9O1xyXG59XSk7XHJcblxyXG5hcHBNb2R1bGUuZGlyZWN0aXZlKCd2aXNpYmxlT25NYXJrJywgW2Z1bmN0aW9uICgpIHtcclxuICAgIHJldHVybiB7XHJcbiAgICAgICAgcmVzdHJpY3Q6ICdBJyxcclxuICAgICAgICBzY29wZToge1xyXG4gICAgICAgICAgICBtYXJrOiAnQCdcclxuICAgICAgICB9LFxyXG4gICAgICAgIGxpbms6IGZ1bmN0aW9uIChzY29wZSwgZWxlbWVudCwgYXR0cnMpIHtcclxuICAgICAgICAgICAgc2NvcGUuJHdhdGNoKCdtYXJrJywgZnVuY3Rpb24obmV3VmFsdWUsIG9sZFZhbHVlKSB7XHJcbiAgICAgICAgICAgICAgICBpZihuZXdWYWx1ZSA9PT0gJ3RydWUnKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgZWxlbWVudC5hZGRDbGFzcygndmlzaWJsZScpO1xyXG4gICAgICAgICAgICAgICAgICAgIH0sIDEwMCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBlbGVtZW50LnJlbW92ZUNsYXNzKCd2aXNpYmxlJyk7XHJcbiAgICAgICAgICAgICAgICAgICAgfSwgMTAwKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfVxyXG4gICAgfTtcclxufV0pXHJcblxyXG5cclxuLyphcHBNb2R1bGUuZGlyZWN0aXZlKCd0d2lua2xlVGFnJywgW2Z1bmN0aW9uICgpIHtcclxuICAgIHJldHVybiB7XHJcbiAgICAgICAgcmVzdHJpY3Q6ICdBJyxcclxuICAgICAgICBzY29wZToge1xyXG4gICAgICAgICAgICBuYW1lOiAnQCcsIFxyXG4gICAgICAgICAgICB2YWx1ZTogJ0AnXHJcbiAgICAgICAgfSxcclxuICAgICAgICBsaW5rOiBmdW5jdGlvbiAoc2NvcGUsIGVsZW1lbnQsIGF0dHJzKSB7XHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCd0d2lua2xlVGFnJywgc2NvcGUubmFtZSwgc2NvcGUudmFsdWUpO1xyXG4gICAgICAgICAgICB2YXIgbmFtZSA9IHNjb3BlLm5hbWUsXHJcbiAgICAgICAgICAgICAgICB2YWx1ZSA9IHBhcnNlSW50KHNjb3BlLnZhbHVlKTtcclxuXHJcbiAgICAgICAgICAgIGVsZW1lbnQuY3NzKHtcclxuICAgICAgICAgICAgICAgICdmb250LXNpemUnOiAoMTYgKyBza2lsbC52YWx1ZSAqIDI0KSArICdweCcsIFxyXG4gICAgICAgICAgICAgICAgJ2xpbmUtaGVpZ2h0JzogJzEuNScsIFxyXG4gICAgICAgICAgICAgICAgJ3RyYW5zaXRpb24nOiAndG9wIDAuNHMgZWFzZSAnICsgIChza2lsbC52YWx1ZSkgKiAzICsgJ3MnICsgJywnICsgJ29wYWNpdHkgMC40cyBlYXNlICcgKyAgc2tpbGwudmFsdWUgKiAzICsgJ3MnICsgJywnICsgJ3RyYW5zZm9ybSAwLjRzIGVhc2UgJywgXHJcbiAgICAgICAgICAgICAgICAndG9wJzogKGxvYWRQZXJjZW50YWdlLnNraWxscyA9PT0gMTAwKSAmJiAnMCcgfHwgJzEwcHgnLCBcclxuICAgICAgICAgICAgICAgICdhbmltYXRpb24tZGVsYXknOiAoMTAgKyBza2lsbC52YWx1ZSAqIDYpICsgJ3MnXHJcbiAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICB9XHJcbiAgICB9O1xyXG59XSkqLyJdLCJzb3VyY2VSb290IjoiL3NvdXJjZS8ifQ==
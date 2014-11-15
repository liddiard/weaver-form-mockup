(function(){
    var app = angular.module('order', []);

    app.controller('FormController', function($scope, $http, $filter) {

        // Attributes //

        var form = this;

        this.TAX_RATE = 6.75;
        this.styles = [];
        this.sizes = [];
        this.prebuilt_available = false;
        this.finishable = false;
        this.features = ['Deluxe', 'Premier', 'Vinyl'];
        this.noFeature = ['Porch', 'Porch 12/12 Pitch', 'Leanto']; // these styles don't have a feature selection
        this.base_price = 0;
        this.options = {
            style: '',
            size: '',
            feature: '',
            zone: 0,
            build_type: '',
            finish: '',
        }; // gets populated by user's selections in first section
        this.section = 0; // this section is currently active


        // Methods //

        this.isSelected = function(checkSection) {
            return this.section === checkSection;
        };
        this.nextSection = function() {
            this.section++;
        };
        this.selectSection = function(setSection) {
            this.section = setSection;
        };
        this.displaySize = function(size) {
            if (size) return size.width + "x" + size.len;
        };
        this.requiresFeature = function(style) {
            for (var i = 0; i < this.noFeature.length; i++) {
                if (style === this.noFeature[i])
                    return false;
            }
            return true;
        };
        this.validBaseOptions = function() {
            if (!this.options.style.length || !this.options.size || !this.options.zone) {
                console.log('missing style or size or zone');
                return false; // everything has to have these options
            }
            if (this.prebuilt_available && !this.options.build_type.length) {
                console.log('missing build type');
                return false;
            }
            if (this.finishable && !this.options.finish.length) {
                console.log('missing finish');
                return false;
            }
            if (this.requiresFeature(this.options.style) && !this.options.feature.length) {
                console.log('missing feature');
                return false;
            }
            return true;
        };
        this.displayPrice = function(component){
            if (component.price === 0)
                return;
            var types = {
                'sq_ft': 'sq. ft.',
                'ln_ft': 'ln. ft.',
                'each': 'ea.'
            };
            var formatted_currency = $filter('currency')(component.price, "$");
            if (types.hasOwnProperty(component.pricing_type))
                return "[" + formatted_currency + " /" + types[component.pricing_type] + "]";
            else return "[" + formatted_currency + "]";
        };
        this.getAdditions = function() {
            $http.jsonp('http://peaceful-beyond-1028.herokuapp.com/new_components/?callback=JSON_CALLBACK', {params: {len: form.options.size.len, width: form.options.size.width, style: form.options.style, feature: form.options.feature}}).success(function(data){
                form.additions = data;
            });
        };
        this.totalOptionsPrice = function() {
            return;
        };
        this.submit = function() {
            $http.jsonp('http://peaceful-beyond-1028.herokuapp.com/prices/?callback=JSON_CALLBACK', {data: {options: form.options, additions: form.additions}}).success(function(data){
                alert(data);
            })
            .error(function(data, status, headers, config){
                alert(data);
            });
        };

        $http.jsonp('http://peaceful-beyond-1028.herokuapp.com/styles/?callback=JSON_CALLBACK').success(function(data){
            form.styles = data;
        })
        .error(function(data, status, headers, config){
            console.log(data);
        });


        // Watches //

        $scope.$watch(
            function(scope) { return form.options.style },
            function() {
                $http.jsonp('http://peaceful-beyond-1028.herokuapp.com/sizes/?callback=JSON_CALLBACK', {params: {style: form.options.style}}).success(function(data){
                    form.sizes = data;
                });
            }
        );

        $scope.$watch(
            function(scope) { return form.options },
            function() {
                if (form.options.style.length && form.options.size && form.options.feature) {
                    $http.jsonp('http://peaceful-beyond-1028.herokuapp.com/finishable/?callback=JSON_CALLBACK', {params: {style: form.options.style, width: form.options.size.width, len: form.options.size.len, feature: form.options.feature}}).success(function(data){
                        form.finishable = data;
                    });
                }
                if (form.validBaseOptions()) {
                    $http.jsonp('http://peaceful-beyond-1028.herokuapp.com/prices/?callback=JSON_CALLBACK', {params: {style: form.options.style, width: form.options.size.width, len: form.options.size.len, feature: form.options.feature, zone: form.options.zone, build_type: form.options.build_type}}).success(function(data){
                        var total = data.base;
                        if (form.options.finish === 'paint')
                            total += parseInt(data.paint);
                        else if (form.options.finish === 'stain')
                            total += parseInt(data.stain);
                        form.base_price = total;
                        form.getAdditions();
                    })
                    .error(function(data){
                        console.log(data);
                    });
                }
            }, true // objectEquality http://stackoverflow.com/a/15721434
        );

        $scope.$watch(
            function(scope) { return form.options.size },
            function() {
                if (form.options.style.length) {
                    $http.jsonp('http://peaceful-beyond-1028.herokuapp.com/prebuilt_available/?callback=JSON_CALLBACK', {params: {style: form.options.style, width: form.options.size.width, len: form.options.size.len}}).success(function(data){
                        form.prebuilt_available = data;
                        if (!form.prebuilt_available)
                            form.options.build_type = 'AOS';
                    });
                }
            }, true // objectEquality http://stackoverflow.com/a/15721434
        );

    });

})();

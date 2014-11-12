/// <reference path="scripts/typings/knockout/knockout.d.ts" />
/// <reference path="scripts/typings/knockout.mapping/knockout.mapping.d.ts" />
/// <reference path="scripts/typings/jquery/jquery.d.ts" />

if (!String.prototype.format) {
    String.prototype.format = function () {
        var args = arguments;
        return this.replace(/{(\d+)}/g, function (match, number) {
            return typeof args[number] != 'undefined' ? args[number] : match;
        });
    };
}

var Person = (function () {
    function Person(firstName, lastName) {
        this.firstName = firstName;
        this.lastName = lastName;
    }
    return Person;
})();

var HospitalAdapter = (function () {
    function HospitalAdapter() {
        this.updateEvent = [];
    }
    HospitalAdapter.prototype.subscribe = function (listener) {
        this.updateEvent.push(listener);
    };

    HospitalAdapter.prototype.done = function (data) {
        for (var i = 0; i < this.updateEvent.length; i++) {
            console.log("called this.updateEvent[i](data);", i, data);
            this.updateEvent[i](data);
        }
    };

    HospitalAdapter.prototype.GetHospitalList = function (id) {
        var _this = this;
        var hospitalUrl = "xml/hospitals{0}.xml";
        hospitalUrl = hospitalUrl.format(id);

        $.ajax(hospitalUrl, { dataType: 'xml', type: 'GET' }).done(function (response) {
            _this.done($.xml2json(response).hospitals);
        });
    };
    return HospitalAdapter;
})();

var ViewModel = (function () {
    function ViewModel(adapter) {
        this.adapter = adapter;
        this.adapter.subscribe(this.Update);
    }
    ViewModel.prototype.Update = function (data) {
        console.log("mapping", data);
        if (this.mapping == null) {
            this.mapping = ko.mapping.fromJS(data, {});
            ko.applyBindings(this.mapping);
        } else
            ko.mapping.fromJS(data, {}, this.mapping);
    };

    ViewModel.prototype.GetHospitalList = function () {
        this.adapter.GetHospitalList(0);
    };

    ViewModel.prototype.PoleErData = function () {
        var _this = this;
        this.adapter.GetHospitalList(0);
        var i = 0;
        while (i < 20) {
            setTimeout(function (i) {
                _this.adapter.GetHospitalList((i % 2));
            }, i * 5000, i);
            i++;
        }
    };
    return ViewModel;
})();

$(function () {
    var vm = new ViewModel(new HospitalAdapter());
    vm.PoleErData();
});

$(document).ready(function () {
    $("#searchBox").autocomplete({
        source: function (request, response) {
            $.ajax({
                url: "http://dev.virtualearth.net/REST/v1/Locations",
                dataType: "jsonp",
                data: {
                    key: "AgJtok0oMDmrQ-w6zJd6I9Zbm4otEaJNEwhmq6Xb9CrJQWP8guNp5XYDBAcb2xv5",
                    q: request.term
                },
                jsonp: "jsonp",
                success: function (data) {
                    var result = data.resourceSets[0];
                    if (result) {
                        if (result.estimatedTotal > 0) {
                            response($.map(result.resources, function (item) {
                                return {
                                    data: item,
                                    label: item.name + ' (' + item.address.countryRegion + ')',
                                    value: item.name
                                };
                            }));
                        }
                    }
                }
            });
        },
        minLength: 1,
        change: function (event, ui) {
            if (!ui.item)
                $("#searchBox").val('');
        },
        select: function (event, ui) {
            displaySelectedItem(ui.item.data);
        }
    });
});

function displaySelectedItem(item) {
    $("#searchResult").empty().append('Result: ' + item.name).append(' (Latitude: ' + item.point.coordinates[0] + ' Longitude: ' + item.point.coordinates[1] + ')');
}
//# sourceMappingURL=app.js.map

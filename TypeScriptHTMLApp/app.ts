/// <reference path="scripts/typings/knockout/knockout.d.ts" />
/// <reference path="scripts/typings/knockout.mapping/knockout.mapping.d.ts" />
/// <reference path="scripts/typings/jquery/jquery.d.ts" />

interface String {
    format(...replacements: string[]): string;
}

if (!String.prototype.format) {
    String.prototype.format = function () {
        var args = arguments;
        return this.replace(/{(\d+)}/g, function (match, number) {
            return typeof args[number] != 'undefined'
                ? args[number]
                : match
                ;
        });
    };
}

class Person {
    firstName: string;
    lastName: string;
    constructor(firstName: string, lastName: string) {
        this.firstName = firstName;
        this.lastName = lastName;
    }
}

class HospitalAdapter {
    url: string;
    updateEvent: {(data: any): void}[] = [];


    subscribe(listener: (data:any) => void)  {
        this.updateEvent.push(listener);
    }

    done(data) {
        for (var i = 0; i < this.updateEvent.length; i++) {
            console.log("called this.updateEvent[i](data);", i, data);
            this.updateEvent[i](data);
        }
    }

    GetHospitalList(id)
    {
        var hospitalUrl :string = "xml/hospitals{0}.xml";
        hospitalUrl = hospitalUrl.format(id);

        $.ajax(hospitalUrl, { dataType: 'xml', type: 'GET' })
            .done((response) => {
                 this.done($.xml2json(response).hospitals);
            });
     }
}

class ViewModel {
    mapping: any;
    adapter: HospitalAdapter;
    constructor(adapter: HospitalAdapter) {
        this.adapter = adapter;
        this.adapter.subscribe(this.Update);
    }
    Update(data: any) {
        console.log("mapping", data);
        if (this.mapping == null)
        {
            this.mapping = ko.mapping.fromJS(data, {});
            ko.applyBindings(this.mapping);
        }
        else
            ko.mapping.fromJS(data, {}, this.mapping);

    }

    GetHospitalList() {
        this.adapter.GetHospitalList(0);
    }

    PoleErData() {
        this.adapter.GetHospitalList(0);
        var i: number = 0;
        while (i < 20) {
            setTimeout((i: number) => {
                this.adapter.GetHospitalList((i % 2));
            }, i * 5000, i);
            i++;
        } 
    }
    
}



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
                            response(
                                $.map(result.resources, function (item) {
                                        return {
                                    data: item,
                                    label: item.name + ' (' + item.address.countryRegion + ')',
                                    value: item.name
                                }
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
    $("#searchResult").empty()
        .append('Result: ' + item.name)
        .append(' (Latitude: ' + item.point.coordinates[0] + ' Longitude: ' + item.point.coordinates[1] + ')');
}
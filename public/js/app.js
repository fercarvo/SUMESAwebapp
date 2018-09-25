
angular.module('app', ['ui.router'])
    .config(["$stateProvider", "$compileProvider", "$urlRouterProvider", "$httpProvider" , function ($stateProvider, $compileProvider, $urlRouterProvider, $httpProvider) {
        $stateProvider
            .state('procesos', {
                templateUrl: '/views/proceso/listar.html',
                controller: 'procesos'
            })
            .state('proceso_detalle', {
                templateUrl: '/views/proceso/detalle.html',
                controller: 'proceso_detalle'
            })
         
    }])
    .run(["$state", "$http", "$templateCache", "godata", "$rootScope", function ($state, $http, $templateCache, godata, $rootScope) {
        //EventBus.addEventListener("newState", cambiar)
        EventBus.addEventListener("proceso_detalle", function pd(evt, data) { $rootScope.$broadcast('proceso_detalle', data) })

        function cambiar(evt, data) {
            console.log(evt, data)
            godata.data = data;
            $state.go(evt.target);
        }

        loadTemplates($state, "procesos", $http, $templateCache)
    }])
    .factory('godata', [function(){
        return {
            data: null
        }
    }])
    .controller('procesos', ["$scope", "$http", "$state", function($scope, $http, $state){

        $scope.proceso = {}

        cargarTabla('procesos', '/proceso/', [
            {name: 'tipo_proceso', alias: 'Proceso'},
            {name: 'producto', alias: 'Producto'},
            {name: 'linea', alias: 'Linea'},
            {name: 'fecha_inicio', alias: 'Fecha Inicio'},
            {name: 'porcentaje_avance', alias: '%avance'},
            {name: 'porc_atraso', alias: '% atraso'},
            {name: 'area', alias: 'Area asignada'},
            {name: undefined, alias: 'Visualizar', cb: data => `<button class="btn boton-itsc" onclick="visualizar_producto(this)" data-itsc="${escribir(data)}">Mostrar </button>`},
        ])

        $scope.$on("proceso_detalle", (evt, data) => {
            $scope.proceso = data
            var class_retraso = Number($scope.proceso.porc_atraso) > 25 ? "bg-danger" : "bg-warning"

            $scope.style_avance = {width: Number($scope.proceso.porcentaje_avance) < 5 ? 5 : $scope.proceso.porcentaje_avance + '%'}
            $scope.style_avance = {width: Number($scope.proceso.porc_atraso) < 5 ? 5 : $scope.proceso.porc_atraso + '%'}
            $scope.class_retraso = `progress-bar ${class_retraso}`
            $("#visualizar_proceso_modal").modal('show')
            $scope.$apply();

            console.log(data)
        })
        
    }])



async function loadTemplates($state, goState, $http, $templateCache) {
    try {
        var promises = []
        var states = $state.get()

        for (i = 1; i < states.length; i++) {
            var p = $http.get(states[i].templateUrl, { cache: $templateCache })
            promises.push(p)
            p.then(function () { }, function (error) { console.log("Error template: ", error) })
        }

        await Promise.all(promises)
                
    } catch (e) {
        console.log("Error templates catch: " + e)
    } finally {
        $state.go(goState) ///////////////////////// State inicial
        document.body.style.pointerEvents = "all"
    }
    
}


async function cargarTabla (id, url, arrColumnas) {
    try {
        var data = await fetch(url, {credentials: "same-origin"})

        if (data.ok)
            data = await data.json();
        else
            throw new Error(`Status: ${data.status}, ${data.statusText}`);

        
        console.log("url", data)

        document.getElementById(id).innerHTML = `
            <thead>
                <tr>
                    ${arrColumnas.reduce((html, obj) => {
                        return html + `<th> ${obj.alias} </th>`;
                    }, '')}
                </tr>
            </thead>
            <tbody>
                ${data.rows.reduce((html, row, index, arr) => {
                    return html + `
                        <tr> 
                            ${arrColumnas.reduce((htmlr, obj) => {
                                return htmlr + `
                                <td> ${obj.name ? (row[obj.name] || '') : obj.cb(row, index, arr)} </td>`;        
                            }, '')}
                        </tr>`;
                }, '')}
            </tbody>
        `;
        
        return $(`#${id}`).DataTable({ 
            responsive: true,
            searching: true,
            paging: true,
            language: {
                "emptyTable":   	"No existe información para mostrar",
                "info":         	"",//"Mostrando página _PAGE_ de _PAGES_",
                "infoEmpty":    	"No existe información para mostrar",
                "infoFiltered": 	"(Filtrado de _MAX_ registros)",
                "lengthMenu":   	"Mostrar _MENU_ registros por página",
                "search":       	"Buscar",
                "zeroRecords":  	"La busqueda no encontró resultados",
                "paginate": {
                    "first":    	"Primero",
                    "previous": 	"Anterior",
                    "next":     	"Siguiente",
                    "last":     	"Último"
                }
            }
         })

    } catch (e) {
        console.log(e);
        alert(e.message)
        return undefined
    }
}

function escribir( json ) {
    return window.btoa(unescape(encodeURIComponent( JSON.stringify(json) )));
}

function leer( str ) {
    return JSON.parse( decodeURIComponent(escape(window.atob( str ))) )
}

function visualizar_producto (element) {
    var data = leer(element.getAttribute('data-itsc'))
    EventBus.dispatch('proceso_detalle', 'proceso_detalle', data)
}
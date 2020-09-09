import { Component, OnInit, NgZone, OnDestroy } from "@angular/core";
import * as am4core from "@amcharts/amcharts4/core";
import * as am4charts from "@amcharts/amcharts4/charts";
import * as am4maps from "@amcharts/amcharts4/maps";
import am4geodata_continentsLow from "@amcharts/amcharts4-geodata/continentsLow";
import am4themes_animated from "@amcharts/amcharts4/themes/animated";
import { Router } from '@angular/router';
import { NgxFreshChatService } from 'ngx-freshchat';

const FC_TOKEN = "66be7290-cfe1-4a79-93b5-f76fb00c8b37"
const FC_URL = "https://wchat.freshchat.com"

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit, OnDestroy {

  // Chart
  public chart: any
  public chart1: any
  public chart2: any
  public chart3: any
  private clicked: any = true
  private clicked1: any = false

  constructor(
    private zone: NgZone,
    private chat: NgxFreshChatService
  ) { }

  ngOnInit() {
    this.getCharts()
    this.chat.init({
      token: FC_TOKEN,
      host: FC_URL
    })
      .subscribe(
        () => console.log('FreshChat is ready!')
      );
  }

  ngOnDestroy() {
    this.zone.runOutsideAngular(
      () => {
        if (this.chart) {
          console.log('Chart disposed')
          this.chart.dispose()
        }
        if (this.chart1) {
          console.log('Chart disposed')
          this.chart1.dispose()
        }
      }
    )
  }

  getCharts() {
    this.zone.runOutsideAngular(() => {
      this.getChart()
      this.getChart1()
      this.getChart2()
      this.getChart3()
    })
  }

  getChart() {
    let chart = am4core.create("chart_dashboard_1", am4charts.XYChart);
    chart.padding(40, 40, 40, 40);

    let categoryAxis = chart.yAxes.push(new am4charts.CategoryAxis());
    categoryAxis.renderer.grid.template.location = 0;
    categoryAxis.dataFields.category = "conversation";
    categoryAxis.renderer.minGridDistance = 1;
    categoryAxis.renderer.inversed = true;
    categoryAxis.renderer.grid.template.disabled = true;

    let valueAxis = chart.xAxes.push(new am4charts.ValueAxis());
    valueAxis.min = 0;

    let series = chart.series.push(new am4charts.ColumnSeries());
    series.dataFields.categoryY = "conversation";
    series.dataFields.valueX = "total";
    series.tooltipText = "{valueX.value}"
    series.columns.template.strokeOpacity = 0;
    series.columns.template.column.cornerRadiusBottomRight = 5;
    series.columns.template.column.cornerRadiusTopRight = 5;

    let labelBullet = series.bullets.push(new am4charts.LabelBullet())
    labelBullet.label.horizontalCenter = "left";
    labelBullet.label.dx = 10;
    labelBullet.label.text = "{values.valueX.workingValue.formatNumber('#.0as')}";
    labelBullet.locationX = 1;

    // as by default columns of the same series are of the same color, we add adapter which takes colors from chart.colors color set
    series.columns.template.adapter.add("fill", function (fill, target) {
      return chart.colors.getIndex(target.dataItem.index);
    });

    categoryAxis.sortBySeries = series;
    chart.data = [
      {
        "conversation": "1",
        "total": 2255
      },
      {
        "conversation": "2+",
        "total": 4300
      },
      {
        "conversation": "3",
        "total": 1000
      },
      {
        "conversation": "4",
        "total": 2465
      },
      {
        "conversation": "5",
        "total": 3550
      },
      {
        "conversation": "6",
        "total": 5000
      },
      {
        "conversation": "7",
        "total": 6240
      },
      {
        "conversation": "8",
        "total": 3295
      },
      {
        "conversation": "9",
        "total": 1000
      },
      {
        "conversation": "10",
        "total": 4310
      },
      {
        "conversation": "> 11",
        "total": 1433
      }
    ]

    this.chart = chart
  }

  getChart1() {
    let chart = am4core.create("chart_dashboard_2", am4charts.PieChart);

    // Add data
    chart.data = [
      {
        "agent": "Level 1",
        "litres": 501.9
      },
      {
        "agent": "Level 2",
        "litres": 301.9
      },
      {
        "agent": "Level 3",
        "litres": 201.1
      },
      {
        "agent": "Level 4",
        "litres": 165.8
      }, 
      {
        "agent": "Level 5",
        "litres": 139.9
      }
    ];

    // Add and configure Series
    let pieSeries = chart.series.push(new am4charts.PieSeries());
    pieSeries.dataFields.value = "litres";
    pieSeries.dataFields.category = "agent";
    pieSeries.slices.template.stroke = am4core.color("#fff");
    pieSeries.slices.template.strokeOpacity = 1;

    // This creates initial animation
    pieSeries.hiddenState.properties.opacity = 1;
    pieSeries.hiddenState.properties.endAngle = -90;
    pieSeries.hiddenState.properties.startAngle = -90;

    chart.hiddenState.properties.radius = am4core.percent(0);
  }

  getChart2() {
    let chart = am4core.create("chart_dashboard_3", am4charts.XYChart);
    chart.paddingRight = 20;

    chart.data = generateChartData();

    let dateAxis = chart.xAxes.push(new am4charts.DateAxis());
    dateAxis.baseInterval = {
      "timeUnit": "minute",
      "count": 1
    };
    dateAxis.tooltipDateFormat = "HH:mm, d MMMM";

    let valueAxis = chart.yAxes.push(new am4charts.ValueAxis());
    valueAxis.tooltip.disabled = true;

    let series = chart.series.push(new am4charts.LineSeries());
    series.dataFields.dateX = "date";
    series.dataFields.valueY = "visits";
    // series.tooltipText = "Visits: [bold]{valueY}[/]";
    series.fillOpacity = 0.3;


    chart.cursor = new am4charts.XYCursor();
    chart.cursor.lineY.opacity = 0;

    dateAxis.start = 0.8;
    dateAxis.keepSelection = true;


    function generateChartData() {
        let chartData = [];
        // current date
        let firstDate = new Date();
        // now set 500 minutes back
        firstDate.setMinutes(firstDate.getDate() - 500);

        // and generate 500 data items
        let visits = 500;
        for (var i = 0; i < 500; i++) {
            let newDate = new Date(firstDate);
            // each time we add one minute
            newDate.setMinutes(newDate.getMinutes() + i);
            // some random number
            visits += Math.round((Math.random()<0.5?1:-1)*Math.random()*10);
            // add data item to the array
            chartData.push({
                date: newDate,
                visits: visits
            });
        }
        return chartData;
    }



  }

  getChart3() {
    let chart = am4core.create("chart_dash_4", am4charts.XYChart);
    chart.paddingRight = 20;

    // Add data
    chart.data = [{
      "year": "08:00",
      "value": 1
    }, {
      "year": "09:00",
      "value": 2
    }, {
      "year": "10:00",
      "value": 3
    }, {
      "year": "11:00",
      "value": 5
    }, {
      "year": "12:00",
      "value": 6
    }, {
      "year": "13:00",
      "value": 3
    }, {
      "year": "14:00",
      "value": 2
    }, {
      "year": "15:00",
      "value": 5
    }, {
      "year": "16:00",
      "value": 2
    }, {
      "year": "17:00",
      "value": 6
    }, {
      "year": "19:00",
      "value": 2
    }, {
      "year": "20:00",
      "value": 3
    }, {
      "year": "21:00",
      "value": 2
    }, {
      "year": "22:00",
      "value": 4
    }, {
      "year": "23:00",
      "value": 7
    }];

    // Create axes
    let categoryAxis = chart.xAxes.push(new am4charts.CategoryAxis());
    categoryAxis.dataFields.category = "year";
    categoryAxis.renderer.minGridDistance = 50;
    categoryAxis.renderer.grid.template.location = 0.5;
    categoryAxis.startLocation = 0.5;
    categoryAxis.endLocation = 0.5;

    // Create value axis
    let valueAxis = chart.yAxes.push(new am4charts.ValueAxis());
    valueAxis.baseValue = 0;

    // Create series
    let series = chart.series.push(new am4charts.LineSeries());
    series.dataFields.valueY = "value";
    series.dataFields.categoryX = "year";
    series.strokeWidth = 2;
    series.tensionX = 0.77;

    // bullet is added because we add tooltip to a bullet for it to change color
    let bullet = series.bullets.push(new am4charts.Bullet());
    bullet.tooltipText = "{valueY}";

    bullet.adapter.add("fill", function (fill, target: any) {
      if (target.dataItem.valueY < 0) {
        return am4core.color("#FF0000");
      }
      return fill;
    })
    let range = valueAxis.createSeriesRange(series);
    range.value = 0;
    range.endValue = -1000;
    range.contents.stroke = am4core.color("#FF0000");
    range.contents.fill = range.contents.stroke;

    // Add scrollbar
    let scrollbarX = new am4charts.XYChartScrollbar();
    scrollbarX.series.push(series);
    chart.scrollbarX = scrollbarX;

    this.chart3 = chart
  }

}

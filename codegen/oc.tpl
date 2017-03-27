#import <Foundation/Foundation.h>
#import "JSONModel.h"

@import JSONModel;
$for{classModel in classes}
@interface ${classModel.prefix}${classModel.className} : JSONModel$for{attr in classModel.attributes}
$if{attr.description}/*$for{line in attr.description.split(/\r\n|\n/)}
 * ${line} $end$
 */$end$
@property (strong, nonatomic) ${attr.iosType} ${attr.name};$end$
@end
@implementation ${classModel.prefix}${classModel.className}
@end
///${JSON.stringify(classModel.innerClasses)}
$if{classModel.innerClasses.length>0}
@interface ${classModel.prefix}${classModel.className}${classModel.innerClasses[0].className}
$for{attr in classModel.innerClasses[0].attributes}
$if{attr.description}
/*$for{line in attr.description.split(/\r\n|\n/)}
 * ${line} $end$
 */$end$
@property (strong, nonatomic) ${attr.iosType} ${attr.name};$end$
@end
@implementation ${classModel.prefix}${classModel.className}${classModel.innerClasses[0].className}
@end
$end$


$end$